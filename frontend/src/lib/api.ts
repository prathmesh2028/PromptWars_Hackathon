/**
 * @file lib/api.ts
 * @description Centralised API + Socket configuration.
 *
 * Deployment modes:
 *   Local dev  — NEXT_PUBLIC_API_URL=http://localhost:5000 (in .env.local)
 *   Cloud Run  — NEXT_PUBLIC_API_URL not set / empty string
 *                → all calls use relative paths (same origin), no CORS issues
 *
 * IMPORTANT: NEXT_PUBLIC_* vars are BAKED IN at Next.js build time.
 * Do NOT rely on runtime env injection for these variables.
 */

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;

/**
 * Base URL for all REST API calls.
 * - Dev:  "http://localhost:5000"
 * - Prod: ""  (relative paths → same Cloud Run origin)
 */
export const API_BASE_URL: string =
  rawApiUrl && rawApiUrl.trim() !== ''
    ? rawApiUrl.replace(/\/$/, '')
    : ''; // empty string → all fetch() calls use relative paths e.g. /api/auth/login

/**
 * WebSocket server URL for socket.io-client.
 * - Dev:  "http://localhost:5000"  (explicit backend port)
 * - Prod: window.location.origin   (same Cloud Run URL → Express handles /socket.io/)
 *
 * The explicit NEXT_PUBLIC_SOCKET_URL allows overriding independently.
 */
export const SOCKET_URL: string = (() => {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit && explicit.trim() !== '') return explicit.replace(/\/$/, '');
  if (API_BASE_URL !== '') return API_BASE_URL;
  // Production same-origin: connect to window.location.origin so socket.io
  // hits the Express server (which handles /socket.io/* at the HTTP level).
  if (typeof window !== 'undefined') return window.location.origin;
  return ''; // SSR fallback — socket is client-side only anyway
})();

/**
 * Typed fetch wrapper — prepends the API base URL, sets content-type,
 * and returns the parsed JSON response.
 *
 * @example
 *   const data = await apiFetch('/api/auth/login', { method: 'POST', body: {...} })
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: Omit<RequestInit, 'body'> & { body?: unknown } = {}
): Promise<T> {
  const { body, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    body: body !== undefined
      ? (typeof body === 'string' ? body : JSON.stringify(body))
      : undefined,
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
