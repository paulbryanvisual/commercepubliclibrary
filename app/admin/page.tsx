"use client";

import { useState, useEffect, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const AdminChat = dynamic(() => import("@/components/ai/AdminChat"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2 text-gray-400">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span className="text-sm">Loading admin interface...</span>
      </div>
    </div>
  ),
});

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

type View = "login" | "reset-request" | "reset-confirm";

function AdminPageInner() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset state
  const [view, setView] = useState<View>("login");
  const [resetUsername, setResetUsername] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const searchParams = useSearchParams();

  /* Check for reset token in URL and existing session on mount */
  useEffect(() => {
    const resetParam = searchParams.get("reset");
    if (resetParam) {
      setResetToken(resetParam);
      setView("reset-confirm");
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/admin-session", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // No session
      } finally {
        setIsCheckingSession(false);
      }
    })();
  }, [searchParams]);

  /* Handle login */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Handle password reset request */
  const handleResetRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: resetUsername }),
      });

      const data = await res.json();
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setView("reset-confirm");
        setResetMessage("Enter your new password below.");
      } else {
        setResetMessage(data.message || "If that account exists, a reset has been initiated.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Handle password reset confirmation */
  const handleResetConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setResetMessage("Password reset successfully! You can now sign in.");
        setTimeout(() => {
          setView("login");
          setResetMessage("");
          setNewPassword("");
          setConfirmPassword("");
          setResetToken("");
        }, 2000);
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* Handle logout */
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin-session", { method: "DELETE" });
    } catch {
      // Best-effort
    }
    setUser(null);
    setUsername("");
    setPassword("");
  };

  /* Loading state */
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm">Checking session...</span>
        </div>
      </div>
    );
  }

  /* ─── Authenticated: show chat ─── */
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Admin top bar */}
        <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Library Admin</p>
              <p className="text-[10px] text-gray-400">Commerce Public Library</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* User identity badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-purple-light px-3 py-1">
              <div className="h-5 w-5 rounded-full bg-purple flex items-center justify-center">
                <span className="text-[10px] font-bold text-white uppercase">
                  {user.displayName.charAt(0)}
                </span>
              </div>
              <span className="text-xs font-semibold text-purple">
                {user.displayName}
              </span>
            </div>
            <span className="hidden lg:inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Chat interface — pass user info */}
        <AdminChat userId={user.id} userName={user.displayName} />
      </div>
    );
  }

  /* ─── Login / Reset gate ─── */
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-purple/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Staff Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Commerce Public Library
          </p>
        </div>

        {/* ─── Login Form ─── */}
        {view === "login" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-purple-light flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                Sign in to manage the library website.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="admin-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  id="admin-username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all"
                  placeholder="Enter your username"
                  autoFocus
                  autoComplete="username"
                />
              </div>
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  id="admin-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-xs text-red flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !username || !password}
                className="w-full rounded-xl bg-purple py-2.5 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setView("reset-request");
                  setError("");
                }}
                className="text-xs text-purple hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>
        )}

        {/* ─── Reset Request Form ─── */}
        {view === "reset-request" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Reset Password</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter your username and we&apos;ll email you a reset link.
              </p>
            </div>

            <form onSubmit={handleResetRequest} className="space-y-4">
              <div>
                <label htmlFor="reset-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  id="reset-username"
                  value={resetUsername}
                  onChange={(e) => {
                    setResetUsername(e.target.value);
                    setError("");
                    setResetMessage("");
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all"
                  placeholder="Enter your username"
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-xs text-red flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {error}
                </p>
              )}

              {resetMessage && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {resetMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !resetUsername}
                className="w-full rounded-xl bg-purple py-2.5 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setView("login");
                  setError("");
                  setResetMessage("");
                }}
                className="text-xs text-gray-500 hover:underline"
              >
                ← Back to sign in
              </button>
            </div>
          </div>
        )}

        {/* ─── Reset Confirm Form ─── */}
        {view === "reset-confirm" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Set New Password</h2>
              <p className="text-sm text-gray-500 mt-1">
                Choose a new password for <strong>{resetUsername}</strong>.
              </p>
            </div>

            <form onSubmit={handleResetConfirm} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all"
                  placeholder="Min 6 characters"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-purple focus:ring-2 focus:ring-purple/20 transition-all"
                  placeholder="Re-enter password"
                />
              </div>

              {error && (
                <p className="text-xs text-red flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {error}
                </p>
              )}

              {resetMessage && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {resetMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !newPassword || !confirmPassword}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setView("login");
                  setError("");
                  setResetMessage("");
                }}
                className="text-xs text-gray-500 hover:underline"
              >
                ← Back to sign in
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-[10px] text-gray-400 mt-6">
          This area is restricted to authorized library staff.
        </p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      }
    >
      <AdminPageInner />
    </Suspense>
  );
}
