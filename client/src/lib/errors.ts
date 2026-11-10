import axios from "axios";

/**
 * Extracts a user-facing message from an unknown thrown value.
 * Prefers the API's `message` field, then the error's own message.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
