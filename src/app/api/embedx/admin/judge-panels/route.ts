import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/adminAuth";
import {
  getAllJudgePanels,
  getJudgePanelByPasskey,
  createJudgePanel,
  updateJudgePanel,
  deleteJudgePanel,
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Super Admin access required." },
      { status: 403 }
    );
  }

  try {
    const panels = await getAllJudgePanels();
    return NextResponse.json({ success: true, data: panels });
  } catch (err) {
    console.error("Error fetching judge panels:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch judge panels." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Super Admin access required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { panelName, passkey, judges } = body;

    if (!panelName || typeof panelName !== "string" || !panelName.trim()) {
      return NextResponse.json(
        { success: false, error: "Panel name is required." },
        { status: 400 }
      );
    }

    if (!passkey || typeof passkey !== "string" || !passkey.trim()) {
      return NextResponse.json(
        { success: false, error: "Panel passkey is required." },
        { status: 400 }
      );
    }

    const trimmedPasskey = passkey.trim();

    // Check collision with environment master keys
    const masterJudgePassword = process.env.JUDGE_PASSWORD || "judge_rc@2026";
    const superAdminPassword = process.env.SUPER_ADMIN_PASS || "admin_rc@2026";
    if (trimmedPasskey === masterJudgePassword || trimmedPasskey === superAdminPassword) {
      return NextResponse.json(
        { success: false, error: "This passkey is reserved for master/admin credentials. Please choose another passkey." },
        { status: 400 }
      );
    }

    const existing = await getJudgePanelByPasskey(trimmedPasskey);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A panel with this passkey already exists. Passkeys must be unique." },
        { status: 400 }
      );
    }

    // Format judges array
    const formattedJudges: { name: string }[] = Array.isArray(judges)
      ? judges
          .map((j: any) => ({
            name: typeof j === "string" ? j.trim() : (j?.name || "").trim(),
          }))
          .filter((j) => j.name.length > 0)
      : [];

    const newPanel = await createJudgePanel({
      panelName: panelName.trim(),
      passkey: trimmedPasskey,
      judges: formattedJudges,
    });

    return NextResponse.json({ success: true, data: newPanel });
  } catch (err: any) {
    console.error("Error creating judge panel:", err);
    if (err?.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A panel with this passkey already exists." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create judge panel." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Super Admin access required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, panelName, passkey, judges } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Panel ID is required." },
        { status: 400 }
      );
    }

    const updates: Partial<{ panelName: string; passkey: string; judges: { name: string }[] }> = {};

    if (panelName && typeof panelName === "string" && panelName.trim()) {
      updates.panelName = panelName.trim();
    }

    if (passkey && typeof passkey === "string" && passkey.trim()) {
      const trimmedPasskey = passkey.trim();
      const existing = await getJudgePanelByPasskey(trimmedPasskey);
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { success: false, error: "Passkey is already used by another panel." },
          { status: 400 }
        );
      }
      updates.passkey = trimmedPasskey;
    }

    if (Array.isArray(judges)) {
      updates.judges = judges
        .map((j: any) => ({
          name: typeof j === "string" ? j.trim() : (j?.name || "").trim(),
        }))
        .filter((j) => j.name.length > 0);
    }

    const updated = await updateJudgePanel(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Panel not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Error updating judge panel:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update judge panel." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSuperAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Super Admin access required." },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Panel ID is required." },
        { status: 400 }
      );
    }

    const success = await deleteJudgePanel(id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Panel not found or could not be deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Judge panel deleted successfully." });
  } catch (err) {
    console.error("Error deleting judge panel:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete judge panel." },
      { status: 500 }
    );
  }
}
