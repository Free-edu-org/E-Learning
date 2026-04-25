import { useCallback, useEffect, useState } from "react";
import type { ErrorType } from "@/components/error/ErrorPage";

/**
 * Custom event name dispatched by the API layer when a global error
 * (maintenance / denied / not-found) should take over the screen.
 */
const API_ERROR_EVENT = "api:globalError";

export interface ApiGlobalErrorDetail {
  type: ErrorType;
  message?: string;
}

/** Dispatch a global API error that will be caught by useApiErrorHandler. */
export function dispatchApiError(detail: ApiGlobalErrorDetail) {
  window.dispatchEvent(
    new CustomEvent<ApiGlobalErrorDetail>(API_ERROR_EVENT, { detail }),
  );
}

/**
 * React hook consumed by the top-level App wrapper.
 * Returns the current global error (if any) and a function to clear it.
 */
export function useApiErrorHandler() {
  const [error, setError] = useState<ApiGlobalErrorDetail | null>(null);

  const clearApiError = useCallback(() => setError(null), []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ApiGlobalErrorDetail>).detail;
      setError(detail);
    };

    window.addEventListener(API_ERROR_EVENT, handler);
    return () => window.removeEventListener(API_ERROR_EVENT, handler);
  }, []);

  return { apiError: error, clearApiError };
}

