import { useCallback, useEffect, useState } from 'react';

export const useToast = (durationMs = 3500) => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs]);

  const showToast = useCallback((msg: string) => setMessage(msg), []);
  const clearToast = useCallback(() => setMessage(null), []);

  return { message, showToast, clearToast };
};
