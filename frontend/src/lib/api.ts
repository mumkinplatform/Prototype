import { getToken } from "./auth";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(API_URL + path, init);

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const body = data as { error?: string; detail?: string; message?: string };
    // Prefer the human-readable `message` over the technical `error` code so
    // toast.error(e.message) shows "هذا الإيميل مرتبط أصلاً..." instead of
    // "role_conflict". `error` remains accessible via err.body.error for code
    // paths that need to branch on the type of failure.
    const message = body.message
      ? body.message
      : body.detail
      ? `${body.error ?? 'error'}: ${body.detail}`
      : body.error ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}

/** Uploads a single file via multipart/form-data, preserving the Authorization header. */
export async function apiUpload<T>(path: string, file: File, fieldName = "file"): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file);
  const res = await fetch(API_URL + path, {
    method: "POST",
    headers: { ...authHeader() }, // Don't set Content-Type — the browser adds it with the boundary
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const body = data as { error?: string };
    throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`, data);
  }
  return data as T;
}
