import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAsyncOperationOptions {
  timeout?: number;
  onTimeout?: () => void;
  onError?: (error: Error) => void;
}

export function useAsyncOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: UseAsyncOperationOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { timeout = 15000, onTimeout, onError } = options;

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    if (loading) return null;
    
    setLoading(true);
    setError(null);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      console.warn('Operation timeout - forcing state reset');
      setLoading(false);
      const timeoutError = new Error('Operation timed out. Please try again.');
      setError(timeoutError);
      if (onTimeout) onTimeout();
      if (onError) onError(timeoutError);
    }, timeout);
    
    try {
      const result = await operation(...args);
      
      // Clear timeout on success
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      setLoading(false);
      return result;
      
    } catch (err) {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      const error = err instanceof Error ? err : new Error('An unexpected error occurred');
      setError(error);
      if (onError) onError(error);
      setLoading(false);
      throw error;
    }
  }, [operation, loading, timeout, onTimeout, onError]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setLoading(false);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    loading,
    error,
    execute,
    reset
  };
}