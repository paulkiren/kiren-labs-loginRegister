export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch (_) {
    // ignore body parse errors
  }

  if (!response.ok) {
    const message = (data as any)?.message || 'Request failed';
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
