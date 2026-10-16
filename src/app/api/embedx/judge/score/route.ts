import { NextRequest, NextResponse } from "next/server";
import { getRegistrationByRegistrationId, updateRegistrationDetails, SystemSettings, Registration } from "@/lib/db";
import { isJudgeAuthorized, getJudgePanelFromRequest } from "@/lib/judgeAuth";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  if (!(await isJudgeAuthorized(request))) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { registrationId, score, scoreBreakdown } = body;

    if (!registrationId || typeof registrationId !== "string") {
      return NextResponse.json({ success: false, error: "Registration ID is required." }, { status: 400 });
    }

    const existing = await getRegistrationByRegistrationId(registrationId);
    if (!existing) {
      return NextResponse.json({ success: false, error: "No team found with that registration ID." }, { status: 404 });
    }

    let numericScore = Number(score);
    let parsedBreakdown: any = undefined;

    if (scoreBreakdown) {
      const { ppt, presentation, prototype, simulation, qa } = scoreBreakdown;
      const pPPT = Math.min(10, Math.max(1, Number(ppt) || 1));
      const pPres = Math.min(10, Math.max(1, Number(presentation) || 1));
      const pProto = Math.min(10, Math.max(1, Number(prototype) || 1));
      const pSim = Math.min(10, Math.max(1, Number(simulation) || 1));
      const pQA = Math.min(10, Math.max(1, Number(qa) || 1));

      numericScore = pPPT + pPres + pProto + pSim + pQA;
      parsedBreakdown = {
        ppt: pPPT,
        presentation: pPres,
        prototype: pProto,
        simulation: pSim,
        qa: pQA,
      };
    } else {
      if (!Number.isFinite(numericScore) || numericScore < 0) {
        return NextResponse.json({ success: false, error: "Score must be a non-negative number." }, { status: 400 });
      }
    }

    // Check if system has Final Round active
    const finalRoundSetting = await SystemSettings.findOne({ key: "finalRoundActive" });
    const isSystemFinalRound = finalRoundSetting ? finalRoundSetting.value === true : false;

    // If final round is active on the platform OR explicitly requested, it is a Final Round evaluation
    const isFinalRound = isSystemFinalRound || body.round === "final";

    if (isFinalRound) {
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

      const isTop20 = topTeams.some((t: any) => t.registrationId === existing.registrationId);
      if (!isTop20 && !existing.isFinalist) {
        return NextResponse.json({ success: false, error: "This team is not in the Top 20 Finalists for the Final Round." }, { status: 400 });
      }
    }

    const panel = await getJudgePanelFromRequest(request);
    const judgeEditorName = panel ? `JUDGE (${panel.panelName})` : "JUDGE";

    // IMPORTANT: In final round, update ONLY finalScore and finalScoreBreakdown.
    // The initial round score (score) MUST REMAIN COMPLETELY UNCHANGED.
    const updates: any = isFinalRound
      ? { finalScore: numericScore, ...(parsedBreakdown && { finalScoreBreakdown: parsedBreakdown }) }
      : { score: numericScore, ...(parsedBreakdown && { scoreBreakdown: parsedBreakdown }) };

    const oldScore = isFinalRound ? (existing.finalScore ?? 0) : existing.score;
    const roundLabel = isFinalRound ? "Final Round Score" : "Round 1 Score";

    const logDetails = parsedBreakdown
      ? `${roundLabel} updated: ${oldScore} -> ${numericScore} (PPT:${parsedBreakdown.ppt}, Pres:${parsedBreakdown.presentation}, Proto:${parsedBreakdown.prototype}, Sim:${parsedBreakdown.simulation}, Q&A:${parsedBreakdown.qa})`
      : `${roundLabel} updated: ${oldScore} -> ${numericScore}`;

    const updated = await updateRegistrationDetails(
      registrationId,
      updates,
      { editedBy: judgeEditorName, changes: logDetails }
    );

    return NextResponse.json({
      success: true,
      isFinalRound,
      data: {
        registrationId: updated!.registrationId,
        teamName: updated!.teamName,
        score: updated!.score, // Initial round score completely untouched
        scoreBreakdown: updated!.scoreBreakdown,
        finalScore: updated!.finalScore ?? 0, // Final round score updated
        finalScoreBreakdown: updated!.finalScoreBreakdown,
      },
    });
  } catch (err) {
    console.error("Judge score update error:", err);
    return NextResponse.json({ success: false, error: "Failed to update score." }, { status: 500 });
  }
}
