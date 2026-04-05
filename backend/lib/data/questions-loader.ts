import * as fs from 'fs';
import * as path from 'path';

interface OnboardingQuestion {
  id: string;
  question: string;
  options: string[];
}

interface QuestionCategory {
  category: string;
  questions: OnboardingQuestion[];
}

interface QuestionsData {
  [key: string]: QuestionCategory;
}

// Cache the questions data to avoid reading file on every request
let questionsCache: QuestionsData | null = null;

/**
 * Load questions data from JSON file
 * Uses caching to improve performance
 */
const loadQuestionsData = (): QuestionsData => {
  if (questionsCache) {
    return questionsCache;
  }

  try {
    const questionsPath = path.join(__dirname, 'onboarding-questions.json');
    const questionsFile = fs.readFileSync(questionsPath, 'utf-8');
    questionsCache = JSON.parse(questionsFile);
    console.log('[Questions Loader] Questions data loaded and cached');
    return questionsCache!;
  } catch (error) {
    console.error('[Questions Loader] Error loading questions file:', error);
    throw new Error('Failed to load onboarding questions');
  }
};

/**
 * Get questions for a specific category
 * Falls back to 'default' if category not found
 *
 * @param category - The agent category (e.g., 'mental-health', 'career', 'fitness')
 * @returns Array of onboarding questions
 */
export const loadQuestionsByCategory = (category?: string): OnboardingQuestion[] => {
  const questionsData = loadQuestionsData();

  // Normalize category: lowercase and replace spaces with hyphens
  const normalizedCategory = category
    ?.toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') || 'default';

  console.log('[Questions Loader] Loading questions for category:', {
    originalCategory: category,
    normalizedCategory,
  });

  // Get questions for the category, fallback to default
  const categoryData = questionsData[normalizedCategory] || questionsData['default'];

  if (!categoryData) {
    console.error('[Questions Loader] No questions found for category:', normalizedCategory);
    throw new Error('No questions available');
  }

  console.log('[Questions Loader] Loaded questions:', {
    category: categoryData.category,
    questionCount: categoryData.questions.length,
  });

  return categoryData.questions;
};

/**
 * Get all available categories
 * Useful for validation or listing available categories
 */
export const getAvailableCategories = (): string[] => {
  const questionsData = loadQuestionsData();
  return Object.keys(questionsData);
};

/**
 * Clear the questions cache
 * Useful for testing or if questions file is updated
 */
export const clearQuestionsCache = (): void => {
  questionsCache = null;
  console.log('[Questions Loader] Questions cache cleared');
};
