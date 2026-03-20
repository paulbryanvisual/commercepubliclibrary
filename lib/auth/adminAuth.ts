/**
 * Multi-user admin authentication with Supabase-backed accounts.
 *
 * - Passwords are hashed with bcrypt
 * - Session is a base64-encoded JSON token stored in a cookie
 * - Token is signed with SESSION_SECRET (HMAC via Web Crypto)
 * - 24-hour expiry
 * - Includes user id + display name in the session payload
 */

import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

const COOKIE_NAME = "cpl_admin_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BCRYPT_ROUNDS = 10;

/* ── Types ── */

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: string;
}

export interface SessionPayload {
  userId: string;
  username: string;
  displayName: string;
  role: string;
  iat: number;
  exp: number;
}

/* ── Crypto helpers ── */

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

/* ── Password helpers ── */

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

/* ── User lookup ── */

export async function getUserByUsername(
  username: string
): Promise<(AdminUser & { passwordHash: string }) | null> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("username", username.toLowerCase().trim())
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    email: data.email,
    role: data.role,
    passwordHash: data.password_hash,
  };
}

export async function getUserById(
  id: string
): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, username, display_name, email, role")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    email: data.email,
    role: data.role,
  };
}

/* ── Login ── */

export async function authenticateUser(
  username: string,
  password: string
): Promise<AdminUser | null> {
  const user = await getUserByUsername(username);
  if (!user) return null;

  // Handle first-time setup: if password_hash is the temp marker, hash and set the provided password
  if (user.passwordHash === "$TEMP_NEEDS_HASH$") {
    const hashed = await hashPassword(password);
    await supabase
      .from("admin_users")
      .update({ password_hash: hashed, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    // Password is now set — return the user
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
    };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
  };
}

/* ── Session management ── */

export async function createSessionToken(user: AdminUser): Promise<string> {
  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const b64 = btoa(JSON.stringify(payload));
  const sig = await sign(b64, getSecret());
  return `${b64}.${sig}`;
}

export async function verifySession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  try {
    const valid = await verify(b64, sig, getSecret());
    if (!valid) return null;
    const payload: SessionPayload = JSON.parse(atob(b64));
    if (!payload.userId || !payload.username) return null;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp)
      return null;
    return payload;
  } catch {
    return null;
  }
}

/* ── Password reset ── */

export async function createResetToken(username: string): Promise<string | null> {
  const user = await getUserByUsername(username);
  if (!user) return null;

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const { error } = await supabase
    .from("admin_users")
    .update({
      reset_token: token,
      reset_token_expires: expires.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return null;
  return token;
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("reset_token", token)
    .single();

  if (error || !data) return false;

  // Check expiry
  if (
    !data.reset_token_expires ||
    new Date(data.reset_token_expires) < new Date()
  ) {
    return false;
  }

  const hashed = await hashPassword(newPassword);
  const { error: updateError } = await supabase
    .from("admin_users")
    .update({
      password_hash: hashed,
      reset_token: null,
      reset_token_expires: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  return !updateError;
}

/** Name of the session cookie. */
export const SESSION_COOKIE_NAME = COOKIE_NAME;
