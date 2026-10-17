import { NextRequest } from "next/server";

export type AdminRole = "super" | "readonly" | null;

function extractPassword(request: NextRequest): string {
  const authHeader = request.headers.get("authorization") || "";
  const customHeader = request.headers.get("x-admin-password") || "";
  const cookiePass = request.cookies.get("embedx_admin_auth")?.value || "";

  return (
    authHeader.replace("Bearer ", "").trim() ||
    customHeader.trim() ||
    cookiePass
  );
}

/**
 * Two-tier admin access:
 * - ADMIN_PASSWORD: read-only (view registrations, receipts, leaderboard)
 * - SUPER_ADMIN_PASS: full access (verify/reject, delete, settings)
 */
export function getAdminRole(request: NextRequest): AdminRole {
  const password = extractPassword(request);
  if (!password) return null;

  const superPassword = process.env.SUPER_ADMIN_PASS || "admin_rc@2026";
  const readonlyPassword = process.env.ADMIN_PASSWORD || "embedx_admin@2026";

  if (password === superPassword) return "super";
  if (password === readonlyPassword) return "readonly";
  return null;
}

export function isAuthorized(request: NextRequest): boolean {
  return getAdminRole(request) !== null;
}

export function isSuperAdmin(request: NextRequest): boolean {
  return getAdminRole(request) === "super";
}
