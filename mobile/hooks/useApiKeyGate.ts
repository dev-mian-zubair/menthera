import { useState, useCallback, useRef } from 'react';
import { useUsage } from '@/providers/UsageProvider';

export interface UseApiKeyGateReturn {
  hasApiKey: boolean;
  showPrompt: boolean;
  requireApiKey: (onSuccess: () => void) => void;
  dismissPrompt: () => void;
  onKeyStored: () => void;
}

export function useApiKeyGate(): UseApiKeyGateReturn {
  const { usage, refetch } = useUsage();
  const [showPrompt, setShowPrompt] = useState(false);
  const onSuccessRef = useRef<(() => void) | null>(null);

  const hasApiKey = usage?.hasApiKey === true;

  const requireApiKey = useCallback(
    (onSuccess: () => void) => {
      if (hasApiKey) {
        onSuccess();
      } else {
        onSuccessRef.current = onSuccess;
        setShowPrompt(true);
      }
    },
    [hasApiKey],
  );

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    onSuccessRef.current = null;
  }, []);

  const onKeyStored = useCallback(async () => {
    setShowPrompt(false);
    await refetch();
    onSuccessRef.current?.();
    onSuccessRef.current = null;
  }, [refetch]);

  return { hasApiKey, showPrompt, requireApiKey, dismissPrompt, onKeyStored };
}
