import { NextRequest, NextResponse } from "next/server";
import {
  createResetToken,
  resetPasswordWithToken,
  getUserByUsername,
} from "@/lib/auth/adminAuth";
import { sendPasswordResetEmail } from "@/lib/email/resend";

/**
 * POST /api/auth/reset-password
 *
 * Two modes:
 * 1. { username } → generates a reset token and emails the reset link
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

  // Mode 1: Request reset — send email
  if (body.username) {
    const user = await getUserByUsername(body.username);

    if (!user || !user.email) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        ok: true,
        message: "If that account exists and has an email on file, a reset link has been sent.",
      });
    }

    const token = await createResetToken(body.username);
    if (!token) {
      return NextResponse.json({
        ok: true,
        message: "If that account exists and has an email on file, a reset link has been sent.",
      });
    }

    // Send the reset email
    await sendPasswordResetEmail(user.email, user.displayName, token);

    return NextResponse.json({
      ok: true,
      message: `A password reset link has been sent to ${user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}.`,
    });
  }

  return NextResponse.json(
    { error: "Provide either { username } or { token, newPassword }" },
    { status: 400 }
  );
}
