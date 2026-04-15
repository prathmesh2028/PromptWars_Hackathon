/**
 * @file lib/api.ts
 * @description Centralised API configuration.
 *
 * All frontend → backend HTTP calls must go through this module.
 * Never hardcode 'http://localhost:5000' anywhere in the codebase.
 *
 * Environment variables:
 *   NEXT_PUBLIC_API_URL   — Base URL of the backend REST API
 *   NEXT_PUBLIC_SOCKET_URL — WebSocket server URL (defaults to API URL)
 */

/** Base URL for all REST API calls */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

/** WebSocket server URL (can differ from the REST URL if needed) */
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, '') || API_BASE_URL;

/**
 * Typed fetch wrapper — prepends the API base URL, sets content-type,
 * and returns the parsed JSON response.
 *
 * @example
 *   const data = await apiFetch('/api/auth/login', { method: 'POST', body: {...} })
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { body?: unknown } = {}
): Promise<T> {
  const { body, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    // Surface the backend error message if available
    throw Object.assign(
      new Error(data?.message || `API error ${response.status}`),
      { status: response.status, data }
    );
  }

  return data as T;
}
