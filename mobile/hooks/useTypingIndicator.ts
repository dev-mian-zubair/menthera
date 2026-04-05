import { useState, useEffect, useCallback } from 'react';

type TimeoutRef = ReturnType<typeof setTimeout> | null;

export interface TypingIndicatorState {
  isTyping: boolean;
  startTyping: () => void;
  stopTyping: () => void;
}

/**
 * Custom hook for managing typing indicators
 * Useful for showing when user or agent is typing
 *
 * @param timeout - Timeout in milliseconds before auto-stopping typing indicator
 * @returns TypingIndicatorState object
 */
export const useTypingIndicator = (timeout: number = 3000): TypingIndicatorState => {
  const [isTyping, setIsTyping] = useState(false);
  const [timeoutId, setTimeoutId] = useState<TimeoutRef>(null);

  const startTyping = useCallback(() => {
    setIsTyping(true);

    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout to auto-stop typing
    const newTimeoutId = setTimeout(() => {
      setIsTyping(false);
    }, timeout);

    setTimeoutId(newTimeoutId);
  }, [timeout, timeoutId]);

  const stopTyping = useCallback(() => {
    setIsTyping(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  }, [timeoutId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return {
    isTyping,
    startTyping,
    stopTyping,
  };
};