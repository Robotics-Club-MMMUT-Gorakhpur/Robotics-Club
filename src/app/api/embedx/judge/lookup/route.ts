import { NextRequest, NextResponse } from "next/server";
import { getRegistrationByRegistrationId } from "@/lib/db";
import { isJudgeAuthorized } from "@/lib/judgeAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isJudgeAuthorized(request)) {
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

    // Judges only need enough to confirm they're scoring the right team --
    // no contact info, payment details, or receipts.
    return NextResponse.json({
      success: true,
      data: {
        registrationId: registration.registrationId,
        teamName: registration.teamName,
        leaderName: registration.leaderName,
        registrationStatus: registration.registrationStatus,
        score: registration.score,
      },
    });
  } catch (err) {
    console.error("Judge lookup error:", err);
    return NextResponse.json({ success: false, error: "Lookup failed." }, { status: 500 });
  }
}
