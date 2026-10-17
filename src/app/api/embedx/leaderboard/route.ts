import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, SystemSettings } from '@/lib/db';
import { isAuthorized } from '@/lib/adminAuth';
import mongoose from 'mongoose';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check if leaderboard is hidden globally and if final round is active
    const [hiddenSetting, finalRoundSetting] = await Promise.all([
      SystemSettings.findOne({ key: 'leaderboard_hidden' }),
      SystemSettings.findOne({ key: 'finalRoundActive' }),
    ]);

    const isHidden = hiddenSetting ? hiddenSetting.value === true : false;
    const finalRoundActive = finalRoundSetting ? finalRoundSetting.value === true : false;

    // Check if request is from an authorized admin (via header x-admin-password, bearer, or cookie)
    const isAdmin = isAuthorized(request);

    // If hidden globally and the request is NOT from an admin, hide both leaderboards from public view
    if (isHidden && !isAdmin) {
      return NextResponse.json({
        hidden: true,
        finalRoundActive: false,
        teams: [],
        finalTeams: [],
      });
    }

    // Get the Registration model
    const RegistrationModel = mongoose.model('Registration');
    
    // Show teams whose payment is verified, registration confirmed, or that have been scored in round 1 or final round
    const teams = await RegistrationModel.find(
      {
        $or: [
          { paymentStatus: 'VERIFIED' },
          { registrationStatus: 'CONFIRMED' },
          { score: { $gt: 0 } },
          { finalScore: { $gt: 0 } },
        ],
      },
      'teamName score finalScore isFinalist _id registrationId leaderName'
    ).sort({ score: -1, teamName: 1 }).lean();

    const formattedTeams = teams.map((team: any, index: number) => ({
      id: team._id.toString(),
      registrationId: team.registrationId,
      name: team.teamName,
      score: team.score || 0, // Initial round score remains unchanged
      isTop20: index < 20,
    }));

    let finalTeams: any[] = [];
    if (finalRoundActive) {
      const top20 = teams.slice(0, 20);
      finalTeams = top20.map((team: any, index: number) => ({
        id: team._id.toString(),
        registrationId: team.registrationId,
        name: team.teamName,
        score: typeof team.finalScore === 'number' ? team.finalScore : 0, // Final round score (starts at 0)
        initialScore: team.score || 0, // Preliminary round score preserved
        initialRank: index + 1,
      }));

      // Sort by final score descending; tie-break by preliminary seed rank
      finalTeams.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.initialRank !== b.initialRank) return a.initialRank - b.initialRank;
        return a.name.localeCompare(b.name);
      });
    }

    return NextResponse.json({
      hidden: isHidden, // informs admin UI that public view is currently hidden
      finalRoundActive,
      teams: formattedTeams,
      finalTeams,
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
