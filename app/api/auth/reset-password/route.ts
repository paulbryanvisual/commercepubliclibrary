import { NextRequest, NextResponse } from "next/server";
import {
  createResetToken,
  resetPasswordWithToken,
} from "@/lib/auth/adminAuth";

/**
 * POST /api/auth/reset-password
 *
 * Two modes:
 * 1. { username } → generates a reset token (displayed to the user for now; email later)
 * 2. { token, newPassword } → resets the password using the token
 */
export async function POST(request: NextRequest) {
  let body: { username?: string; token?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Mode 2: Reset with token
  if (body.token && body.newPassword) {
    if (body.newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const success = await resetPasswordWithToken(body.token, body.newPassword);
    if (!success) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Password has been reset. You can now sign in.",
    });
  }

  // Mode 1: Request reset token
  if (body.username) {
    const token = await createResetToken(body.username);
    if (!token) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        ok: true,
        message: "If that account exists, a reset token has been generated.",
      });
    }

    // In production, this would be emailed. For now, return it directly.
    return NextResponse.json({
      ok: true,
      message: "Reset token generated. Use it to set a new password.",
      resetToken: token,
    });
  }

  return NextResponse.json(
    { error: "Provide either { username } or { token, newPassword }" },
    { status: 400 }
  );
}
