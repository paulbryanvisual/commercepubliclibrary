import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Account",
  description:
    "Manage your Commerce Public Library account — view checkouts, holds, fines, reading history, and account settings.",
};

const tabs = [
  "Overview",
  "Checkouts",
  "Holds",
  "Fines",
  "Reading History",
  "Settings",
];

// Placeholder data for design
const sampleCheckouts = [
  { title: "The Women", author: "Kristin Hannah", due: "Mar 25, 2026", status: "fine" },
  { title: "Demon Copperhead", author: "Barbara Kingsolver", due: "Mar 18, 2026", status: "due-soon" },
  { title: "Tom Clancy: Red Storm", author: "Tom Clancy", due: "Mar 12, 2026", status: "overdue" },
];

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Not logged in state */}
      <div className="max-w-md mx-auto">
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary-light flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Sign In to Your Account
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Use your library card barcode and PIN to access your account.
          </p>

          <form className="space-y-4 text-left">
            <div>
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">
                Library Card Barcode
              </label>
              <input
                type="text"
                id="barcode"
                placeholder="Enter your card number"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                4-Digit PIN
              </label>
              <input
                type="password"
                id="pin"
                maxLength={4}
                placeholder="&#x2022;&#x2022;&#x2022;&#x2022;"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-mid transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button className="mt-4 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <p className="mt-6 text-xs text-gray-400">
            Don&apos;t have a card?{" "}
            <Link href="/get-card" className="text-primary underline">
              Get one free
            </Link>
          </p>
        </div>
      </div>

      {/* ─── Logged-in preview (for design reference) ─── */}
      <div className="mt-16 border-t border-gray-200 pt-12">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-6">
          Logged-in view preview (Phase 4 — SIP2 integration)
        </p>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Checked Out", value: "3", color: "text-primary" },
            { label: "Holds", value: "1", color: "text-blue" },
            { label: "Balance Due", value: "$0.00", color: "text-green-500" },
            { label: "Card Expires", value: "Dec 2026", color: "text-gray-600" },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
              <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                i === 0
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* AI alert */}
        <div className="rounded-xl border border-purple-100 bg-purple-light p-4 mb-6 flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-purple flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">
              2 items due in 3 days — renew now?
            </p>
            <p className="text-xs text-gray-500">
              &ldquo;The Women&rdquo; and &ldquo;Demon Copperhead&rdquo; are due on March 25.
            </p>
            <button className="mt-2 rounded-lg bg-purple px-3 py-1 text-xs font-medium text-white hover:bg-purple-600 transition-colors">
              Renew Both
            </button>
          </div>
        </div>

        {/* Checkouts list */}
        <div className="space-y-3">
          {sampleCheckouts.map((item, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 flex items-center justify-between ${
                item.status === "overdue"
                  ? "border-red-100 bg-red-light"
                  : item.status === "due-soon"
                  ? "border-amber-100 bg-amber-light"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-14 w-10 shrink-0 rounded bg-gradient-to-br from-primary-light to-primary-border" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.author}</p>
                  <p className={`text-xs mt-0.5 ${
                    item.status === "overdue" ? "text-red font-medium" :
                    item.status === "due-soon" ? "text-amber font-medium" :
                    "text-gray-400"
                  }`}>
                    Due: {item.due}
                    {item.status === "overdue" && " — OVERDUE"}
                  </p>
                </div>
              </div>
              <button className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-primary-border hover:text-primary transition-colors">
                Renew
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
