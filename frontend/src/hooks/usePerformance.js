import { useCallback, useRef, useEffect, useState } from 'react';

/**
 * Performance monitoring hook.
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = Date.now() - startTime.current;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} rendered ${renderCount.current} times, took ${renderTime}ms`);
    }

    startTime.current = Date.now();
  });

  return { renderCount: renderCount.current };
};

/**
 * Debounce hook.
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

/**
 * Throttle hook.
 */
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

/**
 * Async state hook.
 */
export const useAsyncState = (initialState = null) => {
  const [state, setState] = useState({
    data: initialState,
    loading: false,
    error: null
  });

  const setLoading = useCallback(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));
  }, []);

  const setData = useCallback((data) => {
    setState({ data, loading: false, error: null });
  }, []);

  const setError = useCallback((error) => {
    setState(prev => ({ ...prev, loading: false, error }));
  }, []);

  return { ...state, setLoading, setData, setError };
};
