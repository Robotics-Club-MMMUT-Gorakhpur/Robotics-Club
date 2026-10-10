import { NextRequest } from "next/server";
import { isSuperAdmin } from "@/lib/adminAuth";

function extractPassword(request: NextRequest): string {
  const authHeader = request.headers.get("authorization") || "";
  const customHeader = request.headers.get("x-judge-password") || "";
  return authHeader.replace("Bearer ", "").trim() || customHeader.trim();
}

/** Judges can score teams. Super admins can too (no separate passkey needed). */
export function isJudgeAuthorized(request: NextRequest): boolean {
  if (isSuperAdmin(request)) return true;
  const judgePassword = process.env.JUDGE_PASSWORD || "judge_rc@2026";
  const password = extractPassword(request);
  return password === judgePassword;
}
