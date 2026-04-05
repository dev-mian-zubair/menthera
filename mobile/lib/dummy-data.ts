import { AgentCategoryInfo } from './types';

/**
 * Agent categories - Static data for UI display
 * This file now only contains static category definitions.
 * All agent data is fetched from the backend via AgentsProvider.
 */

// Agent categories (most popular use cases)
export const agentCategories: AgentCategoryInfo[] = [
  {
    id: 'mental-wellness',
    name: 'Mindfulness',
    description: 'Emotional support & stress relief',
  },
  {
    id: 'health-fitness',
    name: 'Health & Fitness',
    description: 'Wellness & nutrition guidance',
  },
  {
    id: 'productivity',
    name: 'Get Things Done',
    description: 'Time management & organization',
  },
  {
    id: 'career-business',
    name: 'Work & Career',
    description: 'Professional growth & strategy',
  },
  {
    id: 'learning-education',
    name: 'Learn & Grow',
    description: 'Skills & language learning',
  },
];
