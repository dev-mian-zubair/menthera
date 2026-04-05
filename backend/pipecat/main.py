"""
Main entry point for the Pipecat bot in ECS environment.

This module supports two modes:
1. Cold Start Mode: Reads configuration from environment variables (Lambda-triggered)
2. Warm Pool Mode: Continuously polls SQS queue for bot assignments

Mode is determined by BOT_POOL_MODE environment variable.
"""

import os
import sys
import asyncio
import argparse
import signal
import traceback
import json
from typing import Optional, Dict, Any
from datetime import datetime
from collections import deque

import boto3
from botocore.exceptions import ClientError

from loguru import logger

try:
    # Try relative imports (when run as module)
    from .config import BotConfig
    from .bot import SimplePipecatBot
except ImportError:
    # Fall back to absolute imports (when run as script)
    from config import BotConfig
    from bot import SimplePipecatBot

# Configure loguru for ECS logging
logger.remove()
logger.add(
    sys.stderr,
    level="INFO",
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    enqueue=True,
    backtrace=True,
    diagnose=True,
)


# Global state management
_bot_instance = None
_shutdown_requested = False
# Track processed call IDs for idempotency - bounded to prevent memory leak in warm pool mode
_processed_calls: deque = deque(maxlen=10000)


def global_exception_handler(exc_type, exc_value, exc_traceback):
    """
    Global exception handler for unhandled exceptions.
    Logs the error with full traceback and ensures cleanup.
    """
    if issubclass(exc_type, KeyboardInterrupt):
        # Let KeyboardInterrupt through
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return

    logger.critical(
        "Unhandled exception occurred!",
        exc_info=(exc_type, exc_value, exc_traceback)
    )

    # Try to cleanup bot if it exists
    if _bot_instance:
        try:
            logger.info("Attempting emergency cleanup of bot resources...")
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(_bot_instance.cleanup())
            else:
                loop.run_until_complete(_bot_instance.cleanup())
            logger.info("Emergency cleanup completed")
        except Exception as cleanup_error:
            logger.error(f"Error during emergency cleanup: {cleanup_error}")


def signal_handler(signum, frame):
    """
    Handle termination signals gracefully (SIGTERM from ECS task stop).

    ECS sends SIGTERM when stopping a task, giving us time to cleanup before
    force-killing with SIGKILL after the stop timeout (default 30s).

    In warm pool mode, we set shutdown flag to stop polling after current call.
    In cold start mode, we cleanup immediately.
    """
    global _shutdown_requested

    logger.warning(f"🛑 Received signal {signum} ({signal.Signals(signum).name}), initiating graceful shutdown...")

    # Set shutdown flag for warm pool mode
    _shutdown_requested = True

    # Try to cleanup bot if it exists
    if _bot_instance:
        try:
            logger.info("Attempting cleanup on signal...")
            loop = asyncio.get_event_loop()

            # Create cleanup task with timeout
            cleanup_task = _bot_instance.cleanup()

            if loop.is_running():
                # If loop is running, schedule cleanup as a task
                asyncio.create_task(cleanup_task)
                logger.info("Cleanup task scheduled on running loop")
            else:
                # If loop is not running, run cleanup synchronously with timeout
                try:
                    loop.run_until_complete(
                        asyncio.wait_for(cleanup_task, timeout=15.0)
                    )
                    logger.info("✅ Cleanup on signal completed successfully")
                except asyncio.TimeoutError:
                    logger.error("⚠️  Cleanup timeout after 15s, forcing exit")

        except Exception as e:
            logger.error(f"❌ Error during signal cleanup: {e}", exc_info=True)
    else:
        logger.warning("No bot instance to cleanup")

    # In cold start mode, exit immediately
    # In warm pool mode, the polling loop will check _shutdown_requested
    if not os.getenv('BOT_POOL_MODE') == 'true':
        logger.info("Cold start mode - Exiting process...")
        sys.exit(0)
    else:
        logger.info("Warm pool mode - Will exit after current call completes")


# Install global exception handler
sys.excepthook = global_exception_handler

# Install signal handlers for graceful shutdown
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)


def get_room_details_from_env() -> tuple[Optional[str], Optional[str]]:
    """
    Get Daily.co room details from environment variables set by Lambda.

    Returns:
        Tuple of (room_url, room_name) or (None, None) if not found
    """
    room_url = os.getenv('DAILY_ROOM_URL')
    room_name = os.getenv('DAILY_ROOM_NAME')

    if room_url:
        logger.info(f"Found room details from environment: {room_name} -> {room_url}")
        return room_url, room_name

    logger.warning("No room details found in environment variables")
    return None, None


def extract_assignment_from_message(message_body: str) -> Optional[Dict[str, Any]]:
    """
    Extract bot assignment details from SQS message.

    Args:
        message_body: JSON string containing assignment details

    Returns:
        Dictionary with assignment details or None if invalid
    """
    try:
        assignment = json.loads(message_body)

        # Validate required fields
        required_fields = ['callId', 'userId', 'agentId', 'roomUrl', 'roomName', 'botToken', 'agentInfo']
        missing_fields = [field for field in required_fields if field not in assignment]

        if missing_fields:
            logger.error(f"Invalid assignment - missing fields: {missing_fields}")
            return None

        logger.info(f"Extracted assignment for call {assignment['callId']} (agent: {assignment['agentId']})")
        return assignment

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse SQS message body: {e}")
        return None
    except Exception as e:
        logger.error(f"Error extracting assignment: {e}", exc_info=True)
        return None


async def poll_for_assignments():
    """
    ⚡ WARM POOL MODE: Continuously poll SQS queue for bot assignments.

    This function runs in a loop, polling the SQS queue for new call assignments.
    When a message is received, it:
    1. Extracts assignment details from the message
    2. Checks for duplicate processing (idempotency)
    3. Runs the bot for the call
    4. Deletes the message from queue on success
    5. Returns to polling

    The loop exits when:
    - SIGTERM is received (_shutdown_requested = True)
    - A fatal error occurs
    """
    global _shutdown_requested, _processed_calls

    queue_url = os.getenv('BOT_ASSIGNMENTS_QUEUE_URL')
    if not queue_url:
        logger.error("BOT_ASSIGNMENTS_QUEUE_URL not set - cannot start warm pool mode")
        sys.exit(1)

    logger.info(f"🚀 Starting warm pool mode - polling queue: {queue_url}")
    logger.info("Bot is ready to handle calls from the warm pool")

    # Initialize SQS client
    sqs = boto3.client('sqs', region_name=os.getenv('AWS_REGION', 'us-east-1'))

    poll_count = 0
    consecutive_errors = 0
    max_consecutive_errors = 5

    while not _shutdown_requested:
        try:
            poll_count += 1
            logger.debug(f"📡 Polling for assignments (poll #{poll_count})...")

            # Long poll SQS (20 seconds wait time)
            response = sqs.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=1,  # Process one call at a time
                WaitTimeSeconds=20,  # Long polling
                MessageAttributeNames=['All'],
                AttributeNames=['All'],
            )

            # Check if shutdown was requested during polling
            if _shutdown_requested:
                logger.info("Shutdown requested during polling - exiting gracefully")
                break

            # No messages received
            messages = response.get('Messages', [])
            if not messages:
                logger.debug("No messages received, continuing to poll...")
                consecutive_errors = 0  # Reset error counter on successful poll
                continue

            message = messages[0]
            receipt_handle = message['ReceiptHandle']
            message_body = message['Body']

            logger.info(f"📨 Received assignment message (ID: {message.get('MessageId', 'unknown')})")

            # Extract assignment details
            assignment = extract_assignment_from_message(message_body)
            if not assignment:
                logger.error("Failed to extract assignment - deleting invalid message")
                sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)
                continue

            call_id = assignment['callId']

            # Check for duplicate processing (idempotency)
            if call_id in _processed_calls:
                logger.warning(f"⚠️  Call {call_id} already processed - skipping duplicate")
                sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)
                continue

            # Mark call as being processed (deque automatically evicts oldest entries when full)
            _processed_calls.append(call_id)

            # Set environment variables for the bot from assignment
            os.environ['DAILY_ROOM_URL'] = assignment['roomUrl']
            os.environ['DAILY_ROOM_NAME'] = assignment['roomName']
            os.environ['DAILY_ROOM_TOKEN'] = assignment['botToken']
            os.environ['CALL_ID'] = call_id
            os.environ['USER_ID'] = assignment['userId']
            os.environ['AGENT_ID'] = assignment['agentId']

            # Extract agent info
            agent_info = assignment.get('agentInfo', {})
            if agent_info:
                os.environ['AGENT_NAME'] = agent_info.get('name', 'AI Assistant')
                os.environ['AGENT_TYPE'] = agent_info.get('agent_type', 'general')
                if agent_info.get('voice_id'):
                    os.environ['AGENT_VOICE_ID'] = agent_info['voice_id']
                if agent_info.get('voice_emotion'):
                    os.environ['AGENT_VOICE_EMOTION'] = agent_info['voice_emotion']
                if agent_info.get('call_prompt'):
                    os.environ['AGENT_CALL_PROMPT'] = agent_info['call_prompt']

            # Add memory context if available
            if assignment.get('memoryContext'):
                os.environ['MEMORY_CONTEXT'] = assignment['memoryContext']

            # Add remaining minutes if available
            if assignment.get('remainingMinutes') is not None:
                os.environ['REMAINING_MINUTES'] = str(assignment['remainingMinutes'])

            # Set user's BYOK Google API key if provided
            if assignment.get('userGoogleApiKey'):
                os.environ['USER_GOOGLE_API_KEY'] = assignment['userGoogleApiKey']
            elif 'USER_GOOGLE_API_KEY' in os.environ:
                del os.environ['USER_GOOGLE_API_KEY']

            logger.info(f"🎯 Processing call {call_id} for user {assignment['userId']} with agent {assignment['agentId']}")

            # Run the bot for this call
            try:
                await run_bot_from_assignment()

                # Successfully completed - delete message from queue
                logger.info(f"✅ Call {call_id} completed successfully - deleting message from queue")
                sqs.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)

                consecutive_errors = 0  # Reset error counter on success

            except Exception as bot_error:
                logger.error(f"❌ Error processing call {call_id}: {bot_error}", exc_info=True)

                # Don't delete message - let it return to queue or go to DLQ
                # SQS visibility timeout will make it reappear for retry
                consecutive_errors += 1

                if consecutive_errors >= max_consecutive_errors:
                    logger.critical(f"💥 Too many consecutive errors ({consecutive_errors}) - exiting warm pool")
                    break

                # Small delay before next poll after error
                await asyncio.sleep(2)

            # Clean up environment variables
            for key in ['DAILY_ROOM_URL', 'DAILY_ROOM_NAME', 'DAILY_ROOM_TOKEN', 'CALL_ID',
                        'USER_ID', 'AGENT_ID', 'AGENT_NAME', 'AGENT_TYPE', 'AGENT_VOICE_ID',
                        'AGENT_VOICE_EMOTION', 'AGENT_CALL_PROMPT', 'MEMORY_CONTEXT',
                        'REMAINING_MINUTES', 'USER_GOOGLE_API_KEY']:
                os.environ.pop(key, None)

            # Check shutdown flag before continuing
            if _shutdown_requested:
                logger.info("Shutdown requested after call completion - exiting gracefully")
                break

            logger.info("📡 Returning to polling for next assignment...")

        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            logger.error(f"AWS SQS error ({error_code}): {e}", exc_info=True)

            consecutive_errors += 1
            if consecutive_errors >= max_consecutive_errors:
                logger.critical(f"💥 Too many consecutive SQS errors - exiting warm pool")
                break

            # Exponential backoff for SQS errors
            await asyncio.sleep(min(2 ** consecutive_errors, 30))

        except Exception as e:
            logger.error(f"Unexpected error in polling loop: {e}", exc_info=True)

            consecutive_errors += 1
            if consecutive_errors >= max_consecutive_errors:
                logger.critical(f"💥 Too many consecutive errors - exiting warm pool")
                break

            await asyncio.sleep(5)

    logger.info(f"🛑 Warm pool polling stopped (processed {len(_processed_calls)} calls)")
    logger.info("Exiting process...")
    sys.exit(0)


def parse_args():
    """Parse command line arguments for bot configuration."""
    parser = argparse.ArgumentParser(description="Simple AI Companion Bot")

    # Daily.co connection (can be overridden by environment variables)
    parser.add_argument("-u", "--room-url", help="Daily.co room URL")
    parser.add_argument("-t", "--token", help="Daily.co room token (optional)")
    parser.add_argument("-r", "--room-name", help="Daily.co room name")

    # Bot configuration
    parser.add_argument("--llm-provider", choices=["openai", "google"],
                        default="google", help="LLM provider to use")
    parser.add_argument("--tts-provider", choices=["deepgram", "cartesia", "elevenlabs", "rime"],
                        default="cartesia", help="TTS provider to use")

    return parser.parse_args()


async def run_bot():
    """Main function to run the bot (cold start mode)."""
    global _bot_instance

    try:
        # Parse command line arguments
        args = parse_args()

        # Get room details from environment (Lambda sets these)
        env_room_url, env_room_name = get_room_details_from_env()

        # Use environment variables if available, otherwise fall back to args
        room_url = env_room_url or args.room_url
        room_name = env_room_name or args.room_name

        if not room_url:
            logger.error("No room URL provided via environment or arguments")
            sys.exit(1)

        logger.info(f"Starting bot for room: {room_name} ({room_url})")

        # Load bot configuration from environment
        bot_config = BotConfig()
        logger.info(f"Bot configuration loaded: {bot_config.llm_provider} LLM and {bot_config.tts_provider} TTS")

        # Override config with command line args if provided
        if args.llm_provider:
            bot_config.llm_provider = args.llm_provider
        if args.tts_provider:
            bot_config.tts_provider = args.tts_provider

        # Create and run the simple bot
        bot = SimplePipecatBot(bot_config)
        _bot_instance = bot  # Store globally for error handler access

        try:
            logger.info("Setting up transport...")
            await bot.setup_transport(room_url, args.token)
            logger.info("Transport setup complete. Creating pipeline...")
            bot.create_pipeline()
            logger.info("Pipeline created. Starting bot...")
            await bot.start()
        except Exception as e:
            logger.error(f"Error occurred while running bot: {e}", exc_info=True)
            raise
        finally:
            logger.info("Cleaning up bot resources...")
            await bot.cleanup()
            _bot_instance = None
            logger.info("Bot cleanup complete")

    except KeyboardInterrupt:
        logger.info("Bot stopped by user")
    except Exception as e:
        logger.error(f"Bot failed with error: {e}", exc_info=True)
        sys.exit(1)


async def run_bot_from_assignment():
    """
    Run bot for a single call from warm pool assignment.

    This function is called by the polling loop after extracting assignment
    details from SQS message and setting environment variables.
    """
    global _bot_instance

    try:
        # Get room details from environment (set by polling loop)
        room_url = os.getenv('DAILY_ROOM_URL')
        room_name = os.getenv('DAILY_ROOM_NAME')
        room_token = os.getenv('DAILY_ROOM_TOKEN')
        call_id = os.getenv('CALL_ID', 'unknown')

        if not room_url:
            raise ValueError("DAILY_ROOM_URL not set in environment")

        logger.info(f"🎬 Starting bot for call {call_id} - room: {room_name}")

        # Load bot configuration from environment
        bot_config = BotConfig()
        logger.info(f"Bot configuration: {bot_config.llm_provider} LLM, {bot_config.tts_provider} TTS")

        # Create and run the bot
        bot = SimplePipecatBot(bot_config)
        _bot_instance = bot

        try:
            logger.info("Setting up transport...")
            await bot.setup_transport(room_url, room_token)

            logger.info("Creating pipeline...")
            bot.create_pipeline()

            logger.info("Starting bot...")
            start_time = datetime.now()
            await bot.start()
            duration = (datetime.now() - start_time).total_seconds()

            logger.info(f"🎉 Call {call_id} completed successfully (duration: {duration:.1f}s)")

        except Exception as e:
            logger.error(f"Error running bot for call {call_id}: {e}", exc_info=True)
            raise
        finally:
            logger.info(f"Cleaning up bot resources for call {call_id}...")
            await bot.cleanup()
            _bot_instance = None
            logger.info("Bot cleanup complete")

    except Exception as e:
        logger.error(f"Bot assignment failed: {e}", exc_info=True)
        raise


async def main():
    """
    Main entry point that determines mode and runs appropriate function.

    Two modes supported:
    1. Cold Start Mode (BOT_POOL_MODE != 'true'): Run single call from env vars
    2. Warm Pool Mode (BOT_POOL_MODE == 'true'): Continuously poll SQS queue
    """
    bot_pool_mode = os.getenv('BOT_POOL_MODE', 'false').lower() == 'true'

    if bot_pool_mode:
        logger.info("=" * 80)
        logger.info("🔥 WARM POOL MODE ENABLED")
        logger.info("Bot will continuously poll SQS queue for assignments")
        logger.info("=" * 80)
        await poll_for_assignments()
    else:
        logger.info("=" * 80)
        logger.info("❄️  COLD START MODE")
        logger.info("Bot will run single call from environment variables")
        logger.info("=" * 80)
        await run_bot()


if __name__ == "__main__":
    asyncio.run(main())
