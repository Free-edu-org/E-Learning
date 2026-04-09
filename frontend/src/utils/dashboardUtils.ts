import { ApiError } from "@/api/apiClient";

/**
 * Extracts a user-friendly error message from an unknown thrown value.
 * Used across dashboard views (Student, Teacher, Admin).
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.problem.detail || error.problem.title || fallback;
  }

  if (error instanceof Error && error.message === "NETWORK_ERROR") {
    return "Brak połączenia z serwerem.";
  }

  return fallback;
}

/**
 * Formats an ISO date string to a Polish locale medium date display.
 * Returns "Brak danych" when the value is empty/undefined.
 */
export function formatDate(value?: string): string {
  if (!value) {
    return "Brak danych";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
  }).format(date);
}
