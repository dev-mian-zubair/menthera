#!/usr/bin/env node

/**
 * Agents Seeding Script
 * Populates the agents table with initial data from agents.json
 *
 * Usage:
 *   1. Build TypeScript first: npm run build
 *   2. Run seed script:
 *      AWS_PROFILE=menthera-dev node dist/seed/agents.js              # Seed with existing data
 *      AWS_PROFILE=menthera-dev node dist/seed/agents.js --clear      # Clear and reseed (recommended when IDs change)
 *
 * Environment Variables:
 *   AWS_PROFILE: AWS credentials profile (e.g., menthera-dev, menthera-staging, menthera-prod)
 *   NODE_ENV: Environment name (dev, staging, prod) - defaults to 'dev'
 *
 * Flags:
 *   --clear: Delete all existing agents before seeding (use when agent IDs have changed)
 *
 * Note: The script uses the environment to determine table name: ${NODE_ENV}-agents
 * The script will populate dev-agents table when NODE_ENV=dev
 */

/**
 * CARTESIA VOICES (8 emotional voices):
 * Male: Leo (excited, variety), Jace (professional, calm), Kyle (friendly, warm), Gavin (natural, conversational)
 * Female: Maya (warm, engaging), Tessa (professional, clear), Dana (versatile, emotional), Marian (authority, confidence)
 *
 * CARTESIA EMOTIONS (60+ supported):
 * Primary: neutral, angry, excited, content, sad, scared
 * Plus 54+ additional emotions for fine-tuning voice expression
 *
 * Common emotions: professional, calm, excited, content, warm, energetic, engaged, encouraging
 */

import * as fs from 'fs';
import * as path from 'path';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SEED_CONFIG } from './config';
import {
  initializeClient,
  checkTableExists,
  clearTable,
  batchInsert,
  logResult,
  logError,
  logHeader,
} from './utils';

/**
 * Load agents data from JSON file
 */
function loadAgentsData(): any[] {
  // Resolve path from project root
  // When running from dist/seed/agents.js, __dirname is /dist/seed, so go up 2 levels
  const projectRoot = path.resolve(__dirname, '..', '..');
  const dataPath = path.resolve(projectRoot, 'seed', SEED_CONFIG.dataPath.agents);

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data file not found: ${dataPath}`);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(rawData);
}

/**
 * Main seeding function
 */
async function seedAgents(clearExisting: boolean = false): Promise<void> {
  let db: DynamoDBDocumentClient;
  const tableName = SEED_CONFIG.tables.agents;

  logHeader('🌱 Menthera Agents Seeding');

  try {
    // Load agents data from JSON file
    console.log(`📂 Loading agents data from ${SEED_CONFIG.dataPath.agents}...`);
    const agentsData = loadAgentsData();
    console.log(`✅ Loaded ${agentsData.length} agents from file\n`);

    // Initialize DynamoDB client
    console.log(`📡 Connecting to DynamoDB (Region: ${SEED_CONFIG.region})...`);
    db = initializeClient();

    // Check if table exists
    console.log(`\n📋 Checking if table "${tableName}" exists...`);
    console.log(`   Table Name: ${tableName}`);
    console.log(`   Region: ${SEED_CONFIG.region}`);
    console.log(`   Environment: ${SEED_CONFIG.environment}`);

    let tableExists = false;
    try {
      tableExists = await checkTableExists(db, tableName);
    } catch (checkError: any) {
      console.error(`   Error checking table:`, checkError.message);
      throw checkError;
    }

    if (!tableExists) {
      throw new Error(`Table "${tableName}" does not exist. Please create it using CDK.`);
    }
    console.log(`✅ Table "${tableName}" exists`);

    // Clear existing data if requested
    if (clearExisting) {
      console.log(`\n🗑️  Clearing existing data from "${tableName}"...`);
      const startTime = performance.now();
      const clearedCount = await clearTable(db, tableName, 'agent_id', 'agent_type');
      const duration = performance.now() - startTime;
      logResult('Cleared', tableName, clearedCount, duration);
    }

    // Seed agents
    console.log(`\n🚀 Seeding ${agentsData.length} agents...`);
    const startTime = performance.now();
    const insertedCount = await batchInsert(db, tableName, agentsData);
    const duration = performance.now() - startTime;

    logResult('Seeded', tableName, insertedCount, duration);

    // Log agent details
    console.log(`\n📊 Seeded Agents:`);
    agentsData.forEach((agent: any) => {
      console.log(
        `   • ${agent.name.padEnd(10)} (ID: ${agent.agent_id}) - ${agent.description.substring(0, 50)}...`
      );
    });

    logHeader('✨ Seeding Complete');
    console.log(`Total agents seeded: ${insertedCount}`);
    console.log(`Table: ${tableName}`);
    console.log(`Region: ${SEED_CONFIG.region}\n`);
  } catch (error: any) {
    logError('Seeding failed', error);
    process.exit(1);
  }
}

// Parse CLI arguments
const args = process.argv.slice(2);
const clearExisting = args.includes('--clear');

// Run seeding
seedAgents(clearExisting).catch((error) => {
  logError('Fatal error', error);
  process.exit(1);
});
