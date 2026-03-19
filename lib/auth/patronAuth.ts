/**
 * Patron Session Management
 *
 * Handles patron authentication via SIP2 and manages HTTP-only
 * secure cookie sessions with a 7-day expiry.
 */

import { cookies } from "next/headers";
import { getSIP2Client } from "@/lib/atriuum/sip2Client";

// ─── Types ──────────────────────────────────────────────────────────

export interface PatronSession {
  patronBarcode: string;
  displayName: string;
  expiry: number; // Unix timestamp
}

// ─── Configuration ──────────────────────────────────────────────────

const SESSION_COOKIE_NAME = "cpl_patron_session";
const SESSION_EXPIRY_DAYS = 7;

// Simple XOR-based obfuscation key (use a proper encryption lib in production)
const ENCRYPTION_KEY = process.env.SESSION_SECRET || "commerce-library-session-key-2026";

// ─── Encryption helpers ─────────────────────────────────────────────

function encrypt(text: string): string {
  const key = ENCRYPTION_KEY;
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += charCode.toString(16).padStart(4, "0");
  }
  return result;
}

function decrypt(hex: string): string {
  const key = ENCRYPTION_KEY;
  let result = "";
  for (let i = 0; i < hex.length; i += 4) {
    const charCode = parseInt(hex.slice(i, i + 4), 16) ^ key.charCodeAt((i / 4) % key.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

// ─── Session Management ─────────────────────────────────────────────

/**
 * Authenticate a patron via SIP2 and create a session cookie.
 */
export async function loginPatron(
  barcode: string,
  pin: string
): Promise<{ success: boolean; session?: PatronSession; error?: string }> {
  try {
    const sip2 = getSIP2Client();
    const patronInfo = await sip2.patronInfo(barcode, pin);

    if (!patronInfo.valid || !patronInfo.authenticated) {
      return { success: false, error: "Invalid barcode or PIN" };
    }

    const session: PatronSession = {
      patronBarcode: barcode,
      displayName: patronInfo.displayName || "Library Patron",
      expiry: Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    };

    await createPatronSession(session);

    return { success: true, session };
  } catch (err) {
    console.error("Login error:", err);
    return { success: false, error: "Unable to connect to library system" };
  }
}

/**
 * Create a patron session cookie.
 */
export async function createPatronSession(session: PatronSession): Promise<void> {
  const payload = JSON.stringify(session);
  const encrypted = encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });
}

/**
 * Get the current patron session from cookies.
 * Returns null if no valid session exists.
 */
export async function getPatronSession(): Promise<PatronSession | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!cookie?.value) return null;

    const decrypted = decrypt(cookie.value);
    const session: PatronSession = JSON.parse(decrypted);

    // Check expiry
    if (session.expiry < Date.now()) {
      await clearPatronSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Clear the patron session cookie.
 */
export async function clearPatronSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
