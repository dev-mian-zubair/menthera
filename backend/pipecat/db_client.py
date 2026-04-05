"""
DynamoDB client for Pipecat bot to update call status and user usage.

This module provides utilities for the bot to update DynamoDB records
when calls complete, including call status and user usage tracking.
"""

import os
import json
import math
from datetime import datetime
from decimal import Decimal
from typing import Optional
from loguru import logger

try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    logger.error("boto3 is required. Install with: pip install boto3")
    boto3 = None


class DynamoDBClient:
    """Client for updating call status and user usage in DynamoDB."""

    def __init__(self):
        """Initialize DynamoDB client with AWS credentials from environment."""
        self.calls_table = os.getenv('CALLS_TABLE_NAME', 'calls')
        self.users_table = os.getenv('USERS_TABLE_NAME', 'users')
        self.region = os.getenv('AWS_REGION', 'us-east-1')
        self.call_events_queue_url = os.getenv('CALL_EVENTS_QUEUE_URL')

        if boto3:
            self.dynamodb = boto3.resource('dynamodb', region_name=self.region)
            self.sqs = boto3.client('sqs', region_name=self.region)
        else:
            self.dynamodb = None
            self.sqs = None
            logger.warning("boto3 not available - database operations will be skipped")

    async def update_call_status(
        self,
        user_id: str,
        call_id: str,
        status: str,
        duration: Optional[int] = None
    ) -> bool:
        """
        Update call status in DynamoDB with conditional write to prevent race conditions.

        Only allows valid state transitions:
        - initiated -> in_progress ✅
        - in_progress -> completed/failed/missed ✅
        - completed/failed -> * ❌ (final states)

        Args:
            user_id: User ID (partition key)
            call_id: Call ID (sort key)
            status: Call status ('completed', 'failed', 'missed', etc.)
            duration: Call duration in seconds (optional)

        Returns:
            True if successful, False otherwise
        """
        if not self.dynamodb:
            logger.warning("DynamoDB client not initialized - skipping call status update")
            return False

        try:
            table = self.dynamodb.Table(self.calls_table)
            now = datetime.utcnow().isoformat() + 'Z'

            update_expr = 'SET #status = :status, ended_at = :ended_at, updated_at = :now'
            expr_attr_names = {'#status': 'status', '#duration': 'duration'}
            expr_attr_values = {
                ':status': status,
                ':ended_at': now,
                ':now': now,
            }

            if duration is not None:
                update_expr += ', #duration = :duration'
                expr_attr_values[':duration'] = duration

            # ⚡ CONDITIONAL WRITE: Prevent race conditions
            # Only allow state transitions from 'in_progress', 'initiated', or 'ending'
            # 'ending' is set by user-left-handler when user disconnects
            # Prevents overwriting already-completed calls
            condition_expr = '#status IN (:initiated, :in_progress, :ending)'
            expr_attr_values[':initiated'] = 'initiated'
            expr_attr_values[':in_progress'] = 'in_progress'
            expr_attr_values[':ending'] = 'ending'

            table.update_item(
                Key={
                    'user_id': user_id,
                    'call_id': call_id,
                },
                UpdateExpression=update_expr,
                ConditionExpression=condition_expr,
                ExpressionAttributeNames=expr_attr_names,
                ExpressionAttributeValues=expr_attr_values,
            )

            logger.info(f"✅ Updated call {call_id} status to {status} with duration {duration}s")
            return True

        except ClientError as e:
            # Handle conditional check failure gracefully
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.warning(
                    f"⚠️  [RACE CONDITION] Cannot update call {call_id} to {status} - "
                    f"current status does not allow this transition (likely already completed)"
                )
                # This is expected behavior - don't fail
                return False
            else:
                logger.error(f"❌ Failed to update call status: {e}")
                return False
        except Exception as e:
            logger.error(f"❌ Unexpected error updating call status: {e}")
            return False

    async def increment_user_usage(
        self,
        user_id: str,
        call_duration: int
    ) -> bool:
        """
        Update user usage statistics when call completes.

        Args:
            user_id: User ID
            call_duration: Duration of the call in seconds

        Returns:
            True if successful, False otherwise
        """
        if not self.dynamodb:
            logger.warning("DynamoDB client not initialized - skipping user usage update")
            return False

        try:
            table = self.dynamodb.Table(self.users_table)
            now = datetime.utcnow().isoformat() + 'Z'

            # Convert duration to minutes for usage tracking (use Decimal for DynamoDB)
            # Round UP for billing - industry standard (partial minutes count as full minutes)
            usage_minutes = Decimal(str(math.ceil(call_duration / 60)))

            table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='''
                    SET usedMinutes = if_not_exists(usedMinutes, :zero) + :minutes
                ''',
                ExpressionAttributeValues={
                    ':zero': Decimal('0'),
                    ':minutes': usage_minutes,
                },
            )

            logger.info(f"Updated user {user_id} usage: +{usage_minutes:.2f} minutes")
            return True

        except ClientError as e:
            logger.error(f"Failed to update user usage: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error updating user usage: {e}")
            return False

    async def get_call_info(self, user_id: str, call_id: str) -> Optional[dict]:
        """
        Get call information from DynamoDB.

        Args:
            user_id: User ID
            call_id: Call ID

        Returns:
            Call information dict or None if not found
        """
        if not self.dynamodb:
            logger.warning("DynamoDB client not initialized - cannot retrieve call info")
            return None

        try:
            table = self.dynamodb.Table(self.calls_table)
            response = table.get_item(
                Key={
                    'user_id': user_id,
                    'call_id': call_id,
                }
            )

            if 'Item' in response:
                return response['Item']
            return None

        except ClientError as e:
            logger.error(f"Failed to get call info: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting call info: {e}")
            return None

    async def send_call_end_event(
        self,
        user_id: str,
        call_id: str,
        agent_id: str,
        transcript: str,
        duration: int,
        end_reason: str
    ) -> bool:
        """
        Send call end event to SQS for async memory processing.

        Args:
            user_id: User ID
            call_id: Call ID
            agent_id: Agent ID
            transcript: Full call transcript
            duration: Call duration in seconds
            end_reason: Reason for call ending

        Returns:
            True if successful, False otherwise
        """
        if not self.sqs:
            logger.warning("SQS client not initialized - skipping call end event")
            return False

        if not self.call_events_queue_url:
            logger.error("CALL_EVENTS_QUEUE_URL not set - cannot send call end event")
            return False

        try:
            event = {
                'callId': call_id,
                'userId': user_id,
                'agentId': agent_id,
                'transcript': transcript,
                'duration': duration,
                'endReason': end_reason,
            }

            response = self.sqs.send_message(
                QueueUrl=self.call_events_queue_url,
                MessageBody=json.dumps(event)
            )

            logger.info(f"Sent call end event to SQS: {response['MessageId']}")
            return True

        except ClientError as e:
            logger.error(f"Failed to send call end event to SQS: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending call end event: {e}")
            return False
