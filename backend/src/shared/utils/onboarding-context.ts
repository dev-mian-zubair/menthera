/**
 * User profile context utilities
 * Builds personalized context from user onboarding data and assessments for AI prompts
 */

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
};

export function getLanguageName(code: string): string {
  return SUPPORTED_LANGUAGES[code] || 'English';
}

export interface OnboardingData {
  selectedAgentId?: string;
  age?: string;
  gender?: string;
  goals?: string[];
  interests?: string[];
  preferredCoachingStyle?: string;
  preferredLanguage?: string;
  completedAt?: string;
  [key: string]: any;
}

// Assessment types for user profile
export interface AssessmentScore {
  rawScore: number;
  normalizedScore?: number;
  category: string;
  label: string;
  description: string;
  framework: string;
}

export interface AssessmentResult {
  questId: string;
  sessionId: string;
  completedAt: string;
  scores: Record<string, AssessmentScore>;
}

export type UserAssessments = Record<string, AssessmentResult>; // keyed by agentId

export interface UserProfileData {
  onboarding?: OnboardingData | null;
  assessments?: UserAssessments | null;
  userName?: string | null;
}

/**
 * Format assessment results for a specific agent into a readable context string
 */
function formatAssessmentForAgent(
  assessments: UserAssessments | null | undefined,
  agentId: string | null | undefined
): string | null {
  if (!assessments || !agentId) {
    return null;
  }

  const agentAssessment = assessments[agentId];
  if (!agentAssessment || !agentAssessment.scores) {
    return null;
  }

  const { completedAt, scores } = agentAssessment;
  const scoreEntries = Object.entries(scores);

  if (scoreEntries.length === 0) {
    return null;
  }

  // Format the completion date
  const completionDate = new Date(completedAt).toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });

  // Format each score
  const formattedScores = scoreEntries
    .map(([taskId, score]) => {
      const taskTitle = taskId
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const scoreValue = score.rawScore !== undefined ? `(${score.rawScore.toFixed(1)}/7)` : '';

      let result = `- ${taskTitle}: ${score.label} ${scoreValue}`;
      if (score.description) {
        result += `\n    ${score.description}`;
      }
      return result;
    })
    .join('\n');

  return `=== PSYCHOLOGICAL ASSESSMENT RESULTS ===
Assessment completed on ${completionDate}:
${formattedScores}

These assessment results reveal the user's personality traits.
=========================================`;
}

/**
 * Builds a comprehensive context string from user profile data for AI system prompts
 * Includes onboarding data and assessment results
 */
export function buildUserProfileContext(
  data: UserProfileData,
  userName?: string | null,
  currentAgentId?: string | null
): string | null {
  const { onboarding, assessments } = data;
  const name = userName ?? data.userName;

  if (!onboarding && !assessments && !name) {
    return null;
  }

  const contextParts: string[] = [];

  // Language preference (always first if not English)
  if (onboarding?.preferredLanguage && onboarding.preferredLanguage !== 'en') {
    const languageName = getLanguageName(onboarding.preferredLanguage);
    contextParts.push(`IMPORTANT: The user prefers to communicate in ${languageName}. Please respond in ${languageName}.`);
  }

  // Build user profile context
  const profileParts: string[] = [];

  // Add name first if available
  if (name) {
    profileParts.push(`Name: ${name}`);
  }

  if (onboarding?.age) {
    profileParts.push(`Age: ${onboarding.age}`);
  }

  if (onboarding?.gender) {
    profileParts.push(`Gender: ${onboarding.gender}`);
  }

  if (onboarding?.goals && onboarding.goals.length > 0) {
    profileParts.push(`Goals: ${onboarding.goals.join(', ')}`);
  }

  if (onboarding?.interests && onboarding.interests.length > 0) {
    profileParts.push(`Interests: ${onboarding.interests.join(', ')}`);
  }

  if (onboarding?.preferredCoachingStyle) {
    profileParts.push(`Preferred coaching style: ${onboarding.preferredCoachingStyle}`);
  }

  // Add user profile section if we have any data
  if (profileParts.length > 0) {
    contextParts.push(`=== USER PROFILE ===
${profileParts.join('\n')}
=====================`);
  }

  // Add assessment results if available for the current agent
  const assessmentContext = formatAssessmentForAgent(assessments, currentAgentId);
  if (assessmentContext) {
    contextParts.push(assessmentContext);
  }

  return contextParts.length > 0 ? contextParts.join('\n\n') : null;
}

