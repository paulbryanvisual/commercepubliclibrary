"use client";

import { useState, useEffect, type FormEvent } from "react";
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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Check existing session on mount */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/admin-session", { method: "GET" });
        if (res.ok) {
          setIsAuthenticated(true);
        }
      } catch {
        // No session
      } finally {
        setIsCheckingSession(false);
      }
    })();
  }, []);

  /* Handle login */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect password. Please try again.");
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
    setIsAuthenticated(false);
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
  if (isAuthenticated) {
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
            <span className="hidden sm:inline-flex items-center rounded-full bg-purple-light px-2.5 py-0.5 text-[10px] font-semibold text-purple uppercase tracking-wide">
              Staff Only
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Chat interface */}
        <AdminChat />
      </div>
    );
  }

  /* ─── Login gate ─── */
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

        {/* Login card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-purple-light flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              Enter the admin password to access the AI content management interface.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="Enter admin password"
                autoFocus
                autoComplete="current-password"
              />
              {error && (
                <p className="mt-2 text-xs text-red flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {error}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !password}
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
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-6">
          This area is restricted to authorized library staff.
        </p>
      </div>
    </div>
  );
}
