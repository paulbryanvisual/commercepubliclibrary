/**
 * Simple admin authentication helpers.
 *
 * - Password is compared against ADMIN_PASSWORD env var
 * - Session is a base64-encoded JSON token stored in a cookie
 * - Token is signed with SESSION_SECRET (HMAC-like via Web Crypto)
 * - 24-hour expiry
 */

const COOKIE_NAME = "cpl_admin_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/* ── helpers ── */

async function sign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function verify(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await sign(payload, secret);
  return expected === signature;
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET env var is not set");
  return s;
}

/* ── public API ── */

/** Check the plaintext password against env var. */
export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    console.error("ADMIN_PASSWORD env var is not set");
    return false;
  }
  // Constant-time-ish comparison (good enough for a single admin password)
  if (password.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < password.length; i++) {
    mismatch |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Create a signed session token string (to be stored in a cookie). */
export async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  });
  const b64 = btoa(payload);
  const sig = await sign(b64, getSecret());
  return `${b64}.${sig}`;
}

/** Verify a session token string and return true if valid & not expired. */
export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [b64, sig] = parts;
  try {
    const valid = await verify(b64, sig, getSecret());
    if (!valid) return false;
    const payload = JSON.parse(atob(b64));
    if (payload.role !== "admin") return false;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp)
      return false;
    return true;
  } catch {
    return false;
  }
}

/** Name of the session cookie. */
export const SESSION_COOKIE_NAME = COOKIE_NAME;
