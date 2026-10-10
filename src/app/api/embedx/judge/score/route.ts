import { NextRequest, NextResponse } from "next/server";
import { getRegistrationByRegistrationId, updateRegistrationDetails } from "@/lib/db";
import { isJudgeAuthorized } from "@/lib/judgeAuth";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  if (!isJudgeAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { registrationId, score } = body;

    if (!registrationId || typeof registrationId !== "string") {
      return NextResponse.json({ success: false, error: "Registration ID is required." }, { status: 400 });
    }

    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0) {
      return NextResponse.json({ success: false, error: "Score must be a non-negative number." }, { status: 400 });
    }

    const existing = await getRegistrationByRegistrationId(registrationId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "No team found with that registration ID." }, { status: 404 });
    }

    const updated = await updateRegistrationDetails(
      registrationId,
      { score: numericScore },
      { editedBy: "JUDGE", changes: `Score updated: ${existing.score} -> ${numericScore}` }
    );

    return NextResponse.json({
      success: true,
      data: {
        registrationId: updated!.registrationId,
        teamName: updated!.teamName,
        score: updated!.score,
      },
    });
  } catch (err) {
    console.error("Judge score update error:", err);
    return NextResponse.json({ success: false, error: "Failed to update score." }, { status: 500 });
  }
}
