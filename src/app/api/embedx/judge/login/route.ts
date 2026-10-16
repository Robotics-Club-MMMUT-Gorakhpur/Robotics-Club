import { NextRequest, NextResponse } from "next/server";
import { getJudgePanelByPasskey } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Judge passkey is required." },
        { status: 400 }
      );
    }

    const trimmedPassword = password.trim();
    const masterJudgePassword = process.env.JUDGE_PASSWORD || "judge_rc@2026";
    const superAdminPassword = process.env.SUPER_ADMIN_PASS || "admin_rc@2026";

    // 1. Check Master Judge Passkey
    if (trimmedPassword === masterJudgePassword) {
      return NextResponse.json({
        success: true,
        message: "Judge authentication successful.",
        panel: {
          panelName: "Master Judge Panel",
          judges: [],
        },
      });
    }

    // 2. Check Super Admin Passkey
    if (trimmedPassword === superAdminPassword) {
      return NextResponse.json({
        success: true,
        message: "Super Admin judge authentication successful.",
        panel: {
          panelName: "Super Admin (Full Evaluation)",
          judges: [],
        },
      });
    }

    // 3. Check Dynamic Database Panels
    const panel = await getJudgePanelByPasskey(trimmedPassword);
    if (panel) {
      return NextResponse.json({
        success: true,
        message: "Judge authentication successful.",
        panel: {
          id: panel.id,
          panelName: panel.panelName,
          judges: panel.judges,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid judge passkey." },
      { status: 401 }
    );
  } catch (err) {
    console.error("Judge login error:", err);
    return NextResponse.json({ success: false, error: "Authentication failed." }, { status: 500 });
  }
}
