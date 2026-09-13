import { ApiError, apiFetch, clearAuthSession, storeAuthSession } from "@/src/lib/api/client";
import { normalizeRole, normalizeUser, type AuthResponse, type User } from "@/src/lib/types";

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

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function getRolesFromAccessToken(accessToken: string) {
  try {
    const encodedPayload = accessToken.split(".")[1];
    if (!encodedPayload) return [];

    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="))) as Record<string, unknown>;
    const rawRoles = payload.role ?? payload.roles ?? payload.Role ?? payload.Roles ?? payload[ROLE_CLAIM];
    return (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map(normalizeRole).filter((role): role is NonNullable<ReturnType<typeof normalizeRole>> => role !== null);
  } catch {
    return [];
  }
}

function normalizeAuthResponse(payload: RawAuthResponse): AuthResponse {
  const rawUser = payload.User ?? payload.user;
  const accessToken = payload.AccessToken ?? payload.accessToken;

  if (!accessToken || !rawUser) {
    throw new ApiError("The server returned an incomplete login response.", 502);
  }

  const user = normalizeUser(rawUser);
  if (!user) {
    throw new ApiError("The server returned an invalid user record.", 502);
  }

  const tokenRoles = getRolesFromAccessToken(accessToken);
  if (user.Roles.length === 0 && tokenRoles.length > 0) {
    user.Roles = [...new Set(tokenRoles)];
  }

  return {
    AccessToken: accessToken,
    AccessTokenExpiresAt: payload.AccessTokenExpiresAt ?? payload.accessTokenExpiresAt ?? "",
    User: user,
  };
}

export async function loginUser(email: string, password: string) {
  clearAuthSession();
  const payload = await apiFetch<RawAuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ Email: email.trim(), Password: password }),
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

export async function sendPasswordResetCode(email: string) {
  return apiFetch<{ message?: string }>("/api/auth/send-reset-code", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  });
}

export async function verifyAndResetPassword(email: string, verificationCode: string, newPassword: string) {
  return apiFetch<{ message?: string }>("/api/auth/verify-and-reset", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim(),
      VerificationCode: verificationCode.trim(),
      NewPassword: newPassword,
    }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  return apiFetch<void>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, NewPasword: newPassword, ConfirmPassword: confirmPassword }),
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
