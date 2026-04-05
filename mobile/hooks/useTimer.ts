import { useEffect, useState, useRef, useCallback } from 'react';

type IntervalRef = ReturnType<typeof setInterval> | null;

export interface TimerState {
  seconds: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  stop: () => void;
}

/**
 * Custom hook for timer functionality
 * Useful for call duration tracking, typing indicators, etc.
 */
export const useTimer = (initialSeconds: number = 0): TimerState => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<IntervalRef>(null);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  const stop = useCallback(() => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return {
    seconds,
    isRunning,
    start,
    pause,
    reset,
    stop,
  };
};