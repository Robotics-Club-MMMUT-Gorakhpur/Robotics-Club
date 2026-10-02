import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const judgePassword = process.env.JUDGE_PASSWORD || "judge_rc@2026";

    if (!password || typeof password !== "string" || password !== judgePassword) {
      return NextResponse.json(
        { success: false, error: "Invalid judge passkey." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, message: "Judge authentication successful." });
  } catch (err) {
    console.error("Judge login error:", err);
    return NextResponse.json({ success: false, error: "Authentication failed." }, { status: 500 });
  }
}
