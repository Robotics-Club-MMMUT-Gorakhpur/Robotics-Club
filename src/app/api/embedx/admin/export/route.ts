import { NextRequest, NextResponse } from "next/server";
import { getAllRegistrations } from "@/lib/db";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const readonlyPassword = process.env.ADMIN_PASSWORD || "embedx_admin@2026";
  const superPassword = process.env.SUPER_ADMIN_PASS || "admin_rc@2026";
  const authHeader = request.headers.get("authorization") || "";
  const customHeader = request.headers.get("x-admin-password") || "";
  const cookiePass = request.cookies.get("embedx_admin_auth")?.value || "";
  const { searchParams } = new URL(request.url);
  const queryPass = searchParams.get("passkey") || "";

  const candidates = [
    authHeader.replace("Bearer ", "").trim(),
    customHeader.trim(),
    cookiePass,
    queryPass.trim(),
  ];

  return candidates.some((c) => c === readonlyPassword || c === superPassword);
}

function escapeCsv(field: string | number | undefined | null): string {
  if (field === undefined || field === null) return '""';
  const str = String(field).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const registrations = await getAllRegistrations();

    const headers = [
      "S.No",
      "Registration ID",
      "Team Name",
      "Leader Name",
      "Leader Branch",
      "Leader Year",
      "Leader Mobile",
      "Leader Email",
      "Member Count",
      "Members Details",
      "UTR / Transaction ID",
      "Payment Status",
      "Registration Status",
      "Registered At",
    ];

    const rows = registrations.map((r, index) => {
      const membersText = r.members
        .map((m, i) => `M${i + 1}: ${m.name} (${m.branch}, ${m.year}Yr)`)
        .join("; ");

      return [
        index + 1,
        r.registrationId,
        r.teamName,
        r.leaderName,
        r.leaderBranch,
        r.leaderYear,
        r.mobile,
        r.email,
        r.memberCount,
        membersText,
        r.utr,
        r.paymentStatus,
        r.registrationStatus,
        new Date(r.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      ]
        .map(escapeCsv)
        .join(",");
    });

    const csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\n");
    const filename = `EmbedX_Registrations_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export CSV error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to export CSV." },
      { status: 500 }
    );
  }
}
