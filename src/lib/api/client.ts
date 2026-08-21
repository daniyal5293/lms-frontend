import type { ApiErrorData } from "@/src/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  status: number;
  details?: ApiErrorData;

  constructor(message: string, status: number, details?: ApiErrorData) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const AUTH_TOKEN_KEY = "lms_access_token";
const USER_KEY = "lms_user";
const SESSION_COOKIE = "lms_session";

export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function storeAuthSession(accessToken: string, user: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${SESSION_COOKIE}=1; Path=/; SameSite=Lax`;
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;

  const payload = window.localStorage.getItem(USER_KEY);
  if (!payload) return null;

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function buildApiUrl(path: string) {
  const base = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function normalizeError(status: number, payload: unknown, fallback: string) {
  const details = (payload ?? {}) as ApiErrorData;

  const message =
    details?.Message ??
    details?.message ??
    details?.title ??
    (typeof payload === "string" ? payload : undefined) ??
    fallback;

  return new ApiError(message, status, details);
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredAccessToken();

  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");

  if (!(options.body instanceof FormData) && !headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const requestInit: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials ?? "include",
  };

  let response = await fetch(buildApiUrl(path), requestInit);

  if (response.status === 401 && !headers.has("X-Refresh-Attempt")) {
    try {
      await refreshAccessToken();
      const retryHeaders = new Headers(headers);
      retryHeaders.set("Authorization", `Bearer ${getStoredAccessToken() ?? ""}`);
      retryHeaders.set("X-Refresh-Attempt", "true");
      response = await fetch(buildApiUrl(path), {
        ...requestInit,
        headers: retryHeaders,
      });
    } catch {
      throw new ApiError("Your session expired. Please sign in again.", 401);
    }
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      response.status === 401
        ? "Your session expired. Please sign in again."
        : response.status === 403
          ? "You do not have permission to perform this action."
          : response.status === 404
            ? "The requested resource was not found."
            : response.status >= 500
              ? "Something went wrong. Please try again."
              : "Request failed.";

    throw normalizeError(response.status, payload, message);
  }

  if (response.status === 204 || payload === "") {
    return undefined as T;
  }

  return payload as T;
}

export async function refreshAccessToken() {
  const response = await fetch(buildApiUrl("/api/auth/refresh"), {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    clearAuthSession();
    throw new ApiError("Unable to refresh your session.", response.status);
  }

  const payload = (await response.json()) as {
    AccessToken?: string;
    accessToken?: string;
    User?: unknown;
    user?: unknown;
  };
  const accessToken = payload.AccessToken ?? payload.accessToken;

  if (!accessToken) {
    clearAuthSession();
    throw new ApiError("The server did not return a new access token.", 401);
  }

  storeAuthSession(accessToken, payload.User ?? payload.user ?? getStoredUser());
  return accessToken;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}
