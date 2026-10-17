import { NextRequest, NextResponse } from "next/server";
import { getRegistrationByRegistrationId } from "@/lib/db";
import { isJudgeAuthorized } from "@/lib/judgeAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isJudgeAuthorized(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const registrationId = searchParams.get("registrationId") || "";

    if (!registrationId.trim()) {
      return NextResponse.json({ success: false, error: "Registration ID is required." }, { status: 400 });
    }

    const registration = await getRegistrationByRegistrationId(registrationId);

    if (!registration) {
      return NextResponse.json({ success: false, error: "No team found with that registration ID." }, { status: 404 });
    }

    const { SystemSettings, Registration } = await import("@/lib/db");
    const finalRoundSetting = await SystemSettings.findOne({ key: "finalRoundActive" });
    const finalRoundActive = finalRoundSetting ? finalRoundSetting.value === true : false;

    // Check if team is in top 20 preliminary teams
    const topTeams = await Registration.find({
      $or: [
        { paymentStatus: "VERIFIED" },
        { registrationStatus: "CONFIRMED" },
        { score: { $gt: 0 } },
      ],
    })
      .sort({ score: -1, teamName: 1 })
      .limit(20)
      .select("registrationId")
      .lean();

    const isFinalist = topTeams.some((t: any) => t.registrationId === registration.registrationId) || Boolean(registration.isFinalist);

    // Judges only need enough to confirm they're scoring the right team --
    // no contact info, payment details, or receipts.
    return NextResponse.json({
      success: true,
      finalRoundActive,
      data: {
        registrationId: registration.registrationId,
        teamName: registration.teamName,
        leaderName: registration.leaderName,
        registrationStatus: registration.registrationStatus,
        score: registration.score,
        scoreBreakdown: registration.scoreBreakdown || null,
        finalScore: registration.finalScore ?? 0,
        finalScoreBreakdown: registration.finalScoreBreakdown || null,
        isFinalist,
      },
    });
  } catch (err) {
    console.error("Judge lookup error:", err);
    return NextResponse.json({ success: false, error: "Lookup failed." }, { status: 500 });
  }
}
