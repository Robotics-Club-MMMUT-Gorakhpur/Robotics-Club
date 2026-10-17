import { NextRequest } from "next/server";
import { isSuperAdmin } from "@/lib/adminAuth";
import { getJudgePanelByPasskey, JudgePanelRecord } from "@/lib/db";

export function extractJudgePassword(request: NextRequest): string {
  const authHeader = request.headers.get("authorization") || "";
  const customHeader = request.headers.get("x-judge-password") || "";
  return authHeader.replace("Bearer ", "").trim() || customHeader.trim();
}

/** Judges can score teams. Super admins can too (no separate passkey needed). */
export async function isJudgeAuthorized(request: NextRequest): Promise<boolean> {
  if (isSuperAdmin(request)) return true;
  const password = extractJudgePassword(request);
  if (!password) return false;

  const masterJudgePassword = process.env.JUDGE_PASSWORD || "judge_rc@2026";
  if (password === masterJudgePassword) return true;

  try {
    const panel = await getJudgePanelByPasskey(password);
    return !!panel;
  } catch (err) {
    console.error("Error checking judge panel authorization:", err);
    return false;
  }
}

export async function getJudgePanelFromRequest(
  request: NextRequest
): Promise<JudgePanelRecord | null> {
  const password = extractJudgePassword(request);
  if (!password) return null;

  try {
    return await getJudgePanelByPasskey(password);
  } catch {
    return null;
  }
}
