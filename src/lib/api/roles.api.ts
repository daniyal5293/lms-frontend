import { apiFetch } from "@/src/lib/api/client";
import type { Role, RoleListResponse } from "@/src/lib/types";

type RawRole = {
  Id?: string;
  id?: string;
  Name?: string;
  name?: string;
};

export async function getRoles() {
  const payload = await apiFetch<Array<Role | RawRole>>("/api/roles");

  return payload
    .map((role) => (typeof role === "string" ? role : role.Name ?? role.name ?? role.Id ?? role.id ?? ""))
    .filter(Boolean) as RoleListResponse;
}

export async function createRole(roleName: string) {
  return apiFetch<string>("/api/roles", {
    method: "POST",
    body: JSON.stringify(roleName),
  });
}
