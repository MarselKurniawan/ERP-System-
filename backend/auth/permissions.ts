import { APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { AuthData } from "./auth";

export type Role = "admin" | "manager" | "accountant" | "sales" | "purchasing" | "user";

export function requireAuth(): AuthData {
  const auth = getAuthData();
  if (!auth) {
    throw APIError.unauthenticated("authentication required");
  }
  return auth;
}

export function requireRole(allowedRoles: Role[]): AuthData {
  const auth = requireAuth();
  if (!allowedRoles.includes(auth.role as Role)) {
    throw APIError.permissionDenied(
      `access denied: requires one of [${allowedRoles.join(", ")}] but user has role '${auth.role}'`
    );
  }
  return auth;
}

export function hasRole(role: Role | Role[]): boolean {
  const auth = getAuthData();
  if (!auth) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(auth.role as Role);
}
