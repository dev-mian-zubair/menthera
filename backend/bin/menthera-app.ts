#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/stacks/core/database-stack';
import { SharedResourcesStack } from '../lib/stacks/core/shared-resources-stack';
import { ApiGatewayStack } from '../lib/stacks/core/api-gateway-stack';
import { DeploymentStack } from '../lib/stacks/core/deployment-stack';
import { Route53Stack } from '../lib/stacks/core/route53-stack';
import { UsersStack } from '../lib/stacks/users-stack';
import { AgentsStack } from '../lib/stacks/agents-stack';
import { CallStack } from '../lib/stacks/call-stack';
import { HistoryStack } from '../lib/stacks/history-stack';
import { MessageStack } from '../lib/stacks/message-stack';
import { QuestStack } from '../lib/stacks/quest-stack';
import { EngagementStack } from '../lib/stacks/engagement-stack';
import { AchievementsStack } from '../lib/stacks/achievements-stack';
import { OidcStack } from '../lib/stacks/core/oidc-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';

const oidcStack = new OidcStack(app, 'MentheraOidc', {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const databaseStack = new DatabaseStack(app, 'MentheraDatabase', {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const apiGatewayStack = new ApiGatewayStack(app, 'MentheraApiGateway', {
  environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const sharedResourcesStack = new SharedResourcesStack(app, 'MentheraSharedResources', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const usersStack = new UsersStack(app, 'MentheraUsers', {
  environment,
  usersTable: databaseStack.usersTable,
  subscriptionAuditTable: databaseStack.subscriptionAuditTable,
  webhookIdempotencyTable: databaseStack.webhookIdempotencyTable,
  messagesTable: databaseStack.messagesTable,
  callsTable: databaseStack.callsTable,
  questSessionsTable: databaseStack.questSessionsTable,
  userActivityTable: databaseStack.userActivityTable,
  userStreaksTable: databaseStack.userStreaksTable,
  userAchievementsTable: databaseStack.userAchievementsTable,
  restApiId: apiGatewayStack.apiGateway.restApiId,
  rootResourceId: apiGatewayStack.apiGateway.root.resourceId,
  appSecret: sharedResourcesStack.appSecret,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const agentsStack = new AgentsStack(app, 'MentheraAgents', {
  environment,
  agentsTable: databaseStack.agentsTable,
  questSessionsTable: databaseStack.questSessionsTable,
  questDefinitionsTable: databaseStack.questDefinitionsTable,
  usersTable: databaseStack.usersTable,
  restApiId: apiGatewayStack.apiGateway.restApiId,
  rootResourceId: apiGatewayStack.apiGateway.root.resourceId,
  appSecret: sharedResourcesStack.appSecret,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const callStack = new CallStack(app, 'MentheraCall', {
  environment,
  roomsTable: databaseStack.roomsTable,
  callsTable: databaseStack.callsTable,
  usersTable: databaseStack.usersTable,
  agentsTable: databaseStack.agentsTable,
  rateLimitsTable: databaseStack.rateLimitsTable,
  appSecret: sharedResourcesStack.appSecret,
  restApiId: apiGatewayStack.apiGateway.restApiId,
  rootResourceId: apiGatewayStack.apiGateway.root.resourceId,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const historyStack = new HistoryStack(app, 'MentheraHistory', {
  environment,
  callsTable: databaseStack.callsTable,
  messagesTable: databaseStack.messagesTable,
  usersTable: databaseStack.usersTable,
  agentsTable: databaseStack.agentsTable,
  restApiId: apiGatewayStack.apiGateway.restApiId,
  rootResourceId: apiGatewayStack.apiGateway.root.resourceId,
  filesBucket: sharedResourcesStack.filesBucket,
  appSecret: sharedResourcesStack.appSecret,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const questStack = new QuestStack(app, 'MentheraQuests', {
  environment,
  questSessionsTable: databaseStack.questSessionsTable,
  questDefinitionsTable: databaseStack.questDefinitionsTable,
  usersTable: databaseStack.usersTable,
  agentsTable: databaseStack.agentsTable,
  messagesTable: databaseStack.messagesTable,
  restApiId: apiGatewayStack.apiGateway.restApiId,
  rootResourceId: apiGatewayStack.apiGateway.root.resourceId,
  appSecret: sharedResourcesStack.appSecret,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const engagementStack = new EngagementStack(app, 'MentheraEngagement', {
  environment,
  userActivityTable: databaseStack.userActivityTable,
  userStreaksTable: databaseStack.userStreaksTable,
  usersTable: databaseStack.usersTable,
  agentsTable: databaseStack.agentsTable,
  restApiId: apiGatewayStack.apiGateway.restApiId,
  rootResourceId: apiGatewayStack.apiGateway.root.resourceId,
  appSecret: sharedResourcesStack.appSecret,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const achievementsStack = new AchievementsStack(app, 'MentheraAchievements', {
  environment,
  userAchievementsTable: databaseStack.userAchievementsTable,
  userActivityTable: databaseStack.userActivityTable,
  userStreaksTable: databaseStack.userStreaksTable,
  messagesTable: databaseStack.messagesTable,
  callsTable: databaseStack.callsTable,
  questSessionsTable: databaseStack.questSessionsTable,
  restApiId: apiGatewayStack.apiGateway.restApiId,
  rootResourceId: apiGatewayStack.apiGateway.root.resourceId,
  appSecret: sharedResourcesStack.appSecret,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const messageStack = new MessageStack(app, 'MentheraMessage', {
  environment,
  messagesTable: databaseStack.messagesTable,
  usersTable: databaseStack.usersTable,
  agentsTable: databaseStack.agentsTable,
  questSessionsTable: databaseStack.questSessionsTable,
  questDefinitionsTable: databaseStack.questDefinitionsTable,
  filesBucket: sharedResourcesStack.filesBucket,
  appSecret: sharedResourcesStack.appSecret,
  rateLimitsTable: databaseStack.rateLimitsTable,
  appDomain: process.env.APP_DOMAIN,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

const route53Stack = new Route53Stack(app, 'MentheraRoute53', {
  environment,
  messageFunctionUrl: messageStack.functionUrl,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

// Create the Deployment stack which handles API Gateway deployment
// This stack depends on all service stacks that have added methods to the API
// DomainName + BasePathMapping + API A record live here to avoid cyclic dependencies
const deploymentStack = new DeploymentStack(app, 'MentheraDeployment', {
  environment,
  restApiId: apiGatewayStack.apiGateway.restApiId,
  rootResourceId: apiGatewayStack.apiGateway.root.resourceId,
  apiCertificate: route53Stack.apiCertificate,
  hostedZone: route53Stack.hostedZone,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Project: 'Menthera',
    Environment: environment,
  },
});

// Ensure proper deployment order: all service stacks that use API Gateway must be created before deployment
// Note: MessageStack uses Lambda Function URL instead of API Gateway, so it doesn't need to be a dependency
deploymentStack.addDependency(usersStack);
deploymentStack.addDependency(agentsStack);
deploymentStack.addDependency(callStack);
deploymentStack.addDependency(historyStack);
deploymentStack.addDependency(questStack);
deploymentStack.addDependency(engagementStack);
deploymentStack.addDependency(achievementsStack);
