import { ApiError, apiFetch, clearAuthSession, storeAuthSession } from "@/src/lib/api/client";
import type { AuthResponse, User } from "@/src/lib/types";

type RawAuthResponse = {
  AccessToken?: string;
  accessToken?: string;
  AccessTokenExpiresAt?: string;
  accessTokenExpiresAt?: string;
  User?: RawUser;
  user?: RawUser;
};

type RawUser = {
  Id?: string;
  id?: string;
  FullName?: string;
  fullName?: string;
  Email?: string;
  email?: string;
  Roles?: User["Roles"];
  roles?: User["Roles"];
};

function normalizeAuthResponse(payload: RawAuthResponse): AuthResponse {
  const rawUser = payload.User ?? payload.user;
  const accessToken = payload.AccessToken ?? payload.accessToken;

  if (!accessToken || !rawUser) {
    throw new ApiError("The server returned an incomplete login response.", 502);
  }

  const user: User = {
    Id: rawUser.Id ?? rawUser.id ?? "",
    FullName: rawUser.FullName ?? rawUser.fullName ?? "",
    Email: rawUser.Email ?? rawUser.email ?? "",
    Roles: rawUser.Roles ?? rawUser.roles ?? [],
  };

  return {
    AccessToken: accessToken,
    AccessTokenExpiresAt: payload.AccessTokenExpiresAt ?? payload.accessTokenExpiresAt ?? "",
    User: user,
  };
}

export async function loginUser(email: string, password: string) {
  const payload = await apiFetch<RawAuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ Email: email, Password: password }),
  });
  const response = normalizeAuthResponse(payload);

  storeAuthSession(response.AccessToken, response.User);
  return response;
}

export async function registerUser(email: string, password: string, fullName: string) {
  return apiFetch<{ message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ Email: email, Password: password, FullName: fullName }),
  });
}

export async function logoutUser() {
  try {
    await apiFetch<void>("/api/auth/logout", {
      method: "POST",
    });
  } finally {
    clearAuthSession();
  }
}

export function getStoredSessionUser(): User | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem("lms_user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
