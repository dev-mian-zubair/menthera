// Clerk Authentication Hooks
// Re-export Clerk hooks for authentication functionality

export {
  useUser,
  useAuth,
  useSignIn,
  useSignUp,
  useClerk,
} from '@clerk/clerk-expo';

// Custom OAuth Hook
export { useOAuth, type OAuthProvider } from './useOAuth';