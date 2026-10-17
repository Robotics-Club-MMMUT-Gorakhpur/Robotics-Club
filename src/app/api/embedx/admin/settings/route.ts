import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase, SystemSettings } from "@/lib/db";
import { isAuthorized, isSuperAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const settings = await SystemSettings.find({});
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as any);
    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isSuperAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "Read-only access. Super admin required to change settings." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: "Key is required" }, { status: 400 });
    }

    await connectToDatabase();
    await SystemSettings.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );

    if (key === "finalRoundActive" && value === true) {
      const { Registration } = await import("@/lib/db");
      const initialTeams = await Registration.find({
        $or: [
          { paymentStatus: "VERIFIED" },
          { registrationStatus: "CONFIRMED" },
          { score: { $gt: 0 } },
        ],
      })
        .sort({ score: -1, teamName: 1 })
        .lean();

      const top20 = initialTeams.slice(0, 20);
      const top20Ids = top20.map((t: any) => t._id);

      await Registration.updateMany(
        { _id: { $in: top20Ids } },
        { $set: { isFinalist: true } }
      );

      await Registration.updateMany(
        { _id: { $in: top20Ids }, finalScore: { $exists: false } },
        { $set: { finalScore: 0 } }
      );

      await Registration.updateMany(
        { _id: { $nin: top20Ids } },
        { $set: { isFinalist: false } }
      );
    }

    return NextResponse.json({ success: true, message: "Setting updated" });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
