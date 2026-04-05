/**
 * Clerk TypeScript type extensions
 * Extends Clerk types to include custom metadata fields
 */

declare module '@clerk/clerk-expo' {
  interface UserPublicMetadata {
    hasCompletedOnboarding?: boolean;
  }
}

export {};
