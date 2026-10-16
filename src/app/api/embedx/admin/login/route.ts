import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const readonlyPassword = process.env.ADMIN_PASSWORD || "embedx_admin@2026";
    const superPassword = process.env.SUPER_ADMIN_PASS || "admin_rc@2026";

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid admin passkey." },
        { status: 401 }
      );
    }

    let role: "super" | "readonly";
    if (password === superPassword) {
      role = "super";
    } else if (password === readonlyPassword) {
      role = "readonly";
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid admin passkey." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful.",
      token: password,
      role,
    });

    response.cookies.set("embedx_admin_auth", password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { success: false, error: "Authentication failed." },
      { status: 500 }
    );
  }
}
