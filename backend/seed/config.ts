/**
 * Seed Configuration
 * Configuration for database seeding operations
 */

// Get environment from NODE_ENV or default to 'dev'
const environment = process.env.NODE_ENV || 'dev';

// Helper function to generate table name with environment prefix
const getTableName = (baseName: string): string => {
  return `${environment}-${baseName}`;
};

export const SEED_CONFIG = {
  // Environment Configuration
  environment,

  // AWS Configuration
  region: process.env.AWS_REGION || 'us-east-1',

  // Table Names - dynamically generated with environment prefix
  tables: {
    agents: getTableName('agents'),
  },

  // Data file paths
  dataPath: {
    agents: 'data/agents.json',
  },
};
