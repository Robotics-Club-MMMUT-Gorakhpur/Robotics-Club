import { NextRequest, NextResponse } from "next/server";
import { getRegistrationByRegistrationId, deleteRegistrationByRegistrationId } from "@/lib/db";
import { isAuthorized, isSuperAdmin } from "@/lib/adminAuth";
import fs from "node:fs";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const { registrationId } = await params;
    const registration = await getRegistrationByRegistrationId(registrationId);

    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: registration });
  } catch (err) {
    console.error("Admin fetch single registration error:", err);
    return NextResponse.json({ success: false, error: "Failed to load registration." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  }
  if (!isSuperAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "Read-only access. Super admin required to delete." },
      { status: 403 }
    );
  }

  try {
    const { registrationId } = await params;
    const deleted = await deleteRegistrationByRegistrationId(registrationId);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Registration not found." }, { status: 404 });
    }

    // Best-effort cleanup of the uploaded receipt file, if it was stored on disk
    // (not applicable when it's a base64 data: URL, e.g. on Vercel).
    if (deleted.paymentScreenshotPath && !deleted.paymentScreenshotPath.startsWith("data:") && deleted.paymentScreenshotPath !== "vercel_base64" && deleted.paymentScreenshotPath !== "fallback_base64") {
      fs.promises.unlink(deleted.paymentScreenshotPath).catch(() => {
        // Non-critical: file may already be gone or path may be unavailable in this environment.
      });
    }

    return NextResponse.json({
      success: true,
      message: `Registration ${deleted.registrationId} deleted.`,
    });
  } catch (err) {
    console.error("Admin delete registration error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete registration." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  }
  if (!isSuperAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "Read-only access. Super admin required to edit." },
      { status: 403 }
    );
  }

  try {
    const { registrationId } = await params;
    const body = await request.json();
    const { teamName, memberCount, score } = body;

    const { updateRegistrationDetails, getRegistrationByRegistrationId } = await import("@/lib/db");

    const oldReg = await getRegistrationByRegistrationId(registrationId);
    if (!oldReg) {
      return NextResponse.json({ success: false, error: "Registration not found." }, { status: 404 });
    }

    let numericScore: number | undefined;
    if (score !== undefined) {
      numericScore = Number(score);
      if (!Number.isFinite(numericScore) || numericScore < 0) {
        return NextResponse.json({ success: false, error: "Score must be a non-negative number." }, { status: 400 });
      }
    }

    const diffs = [];
    if (teamName !== undefined && oldReg.teamName !== teamName) diffs.push(`Team Name ("${oldReg.teamName}" -> "${teamName}")`);
    if (memberCount !== undefined && oldReg.memberCount !== memberCount) diffs.push(`Member Count (${oldReg.memberCount} -> ${memberCount})`);
    if (numericScore !== undefined && oldReg.score !== numericScore) diffs.push(`Score (${oldReg.score} -> ${numericScore})`);

    if (diffs.length === 0) {
       return NextResponse.json({ success: true, data: oldReg });
    }

    const updated = await updateRegistrationDetails(
      registrationId,
      {
        ...(teamName !== undefined && { teamName }),
        ...(memberCount !== undefined && { memberCount }),
        ...(numericScore !== undefined && { score: numericScore }),
      },
      { editedBy: "ADMIN", changes: `Admin updated: ${diffs.join(", ")}` }
    );

    // Score-only updates (e.g. the Scored Teams list) don't need the full record --
    // in particular, avoid shipping the base64 payment screenshot back down just to
    // confirm a score change. Full-record edits (team name / member count) still get
    // the complete object so the detail page can refresh its own view.
    if (teamName === undefined && memberCount === undefined) {
      return NextResponse.json({
        success: true,
        data: { registrationId: updated!.registrationId, teamName: updated!.teamName, score: updated!.score },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Admin edit registration error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
