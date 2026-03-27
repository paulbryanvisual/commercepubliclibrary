"use client";

import { useState, useEffect, useCallback } from "react";
import { usePatron } from "@/components/patron/PatronContext";
import Link from "next/link";

interface AccountData {
  patron: { name: string; email?: string; phone?: string; cardNumber: string; feeAmount?: string };
  counts: { holds: number; overdue: number; charged: number; fines: number; unavailableHolds: number };
  items: { holds: string[]; overdue: string[]; charged: string[]; fines: string[] };
  screenMessage?: string;
}

const tabs = ["Overview", "Checkouts", "Holds", "Fines"] as const;
type Tab = typeof tabs[number];

export default function AccountPage() {
  const { patron, isLoading: patronLoading, setShowLoginModal, logout } = usePatron();
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [renewingItem, setRenewingItem] = useState<string | null>(null);
  const [renewMessage, setRenewMessage] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/patron/account");
      if (res.ok) {
        const data = await res.json();
        setAccountData(data);
      }
    } catch {
      // Error fetching
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patron) fetchAccount();
  }, [patron, fetchAccount]);

  const handleRenew = async (itemId: string) => {
    setRenewingItem(itemId);
    setRenewMessage(null);
    try {
      const res = await fetch("/api/patron/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      setRenewMessage(data.message || (res.ok ? "Renewed!" : "Could not renew"));
      if (res.ok) fetchAccount(); // Refresh data
    } catch {
      setRenewMessage("Error connecting to library system");
    } finally {
      setRenewingItem(null);
    }
  };

  // Not logged in state
  if (patronLoading) {
    return (
      <div className="mx-auto max-w-site px-4 md:px-8 py-24 text-center">
        <svg className="animate-spin h-8 w-8 text-primary mx-auto" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (!patron) {
    return (
      <div className="mx-auto max-w-site px-4 md:px-8 py-12">
        <div className="max-w-md mx-auto">
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary-light flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Sign In to Your Account
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Use your library card barcode and PIN to access your account.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-mid transition-colors"
            >
              Sign In
            </button>
            <p className="mt-6 text-xs text-gray-400">
              Don&apos;t have a card?{" "}
              <Link href="/get-card" className="text-primary underline">
                Get one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Logged in
  const counts = accountData?.counts;
  const items = accountData?.items;

  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {patron.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{patron.name}</h1>
            <p className="text-sm text-gray-500">Card: {patron.cardNumber}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Checked Out", value: counts?.charged ?? "—", color: "text-primary" },
          { label: "On Hold", value: counts?.holds ?? "—", color: "text-blue" },
          { label: "Overdue", value: counts?.overdue ?? "—", color: counts?.overdue ? "text-red" : "text-green-500" },
          { label: "Fines", value: accountData?.patron.feeAmount || "$0.00", color: "text-gray-600" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className={`text-2xl font-semibold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      )}

      {/* Renew message */}
      {renewMessage && (
        <div className="rounded-lg bg-primary-light border border-primary-border p-3 mb-4 text-sm text-primary-dark flex items-center justify-between">
          {renewMessage}
          <button onClick={() => setRenewMessage(null)} className="text-primary hover:underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Tab content */}
      {!isLoading && (
        <>
          {/* Overview / Checkouts */}
          {(activeTab === "Overview" || activeTab === "Checkouts") && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                {activeTab === "Overview" ? "Current Checkouts" : "All Checkouts"}
              </h2>
              {items?.charged && items.charged.length > 0 ? (
                items.charged.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-10 shrink-0 rounded bg-gradient-to-br from-primary-light to-primary-border flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRenew(item)}
                      disabled={renewingItem === item}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-primary-border hover:text-primary transition-colors disabled:opacity-50"
                    >
                      {renewingItem === item ? "Renewing..." : "Renew"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                  <p className="text-sm text-gray-400">No items checked out</p>
                </div>
              )}

              {/* Also show overdue on overview */}
              {activeTab === "Overview" && items?.overdue && items.overdue.length > 0 && (
                <>
                  <h2 className="text-lg font-semibold text-red mt-6 mb-3">Overdue Items</h2>
                  {items.overdue.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-red-100 bg-red-50 p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-10 shrink-0 rounded bg-red-100 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v4M12 16h.01" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item}</p>
                          <p className="text-xs text-red font-medium">OVERDUE</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRenew(item)}
                        disabled={renewingItem === item}
                        className="rounded-lg bg-red text-white px-3 py-1.5 text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {renewingItem === item ? "Renewing..." : "Renew Now"}
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Holds */}
          {activeTab === "Holds" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Your Holds</h2>
              {items?.holds && items.holds.length > 0 ? (
                items.holds.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-blue-100 bg-blue-50 p-4 flex items-center gap-3"
                  >
                    <div className="h-14 w-10 shrink-0 rounded bg-blue-100 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{item}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                  <p className="text-sm text-gray-400">No holds placed</p>
                  <Link
                    href="/catalog"
                    className="mt-3 inline-block text-sm text-primary font-medium hover:underline"
                  >
                    Browse the catalog →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Fines */}
          {activeTab === "Fines" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Fines & Fees</h2>
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
                <p className="text-3xl font-bold text-gray-800 mb-1">
                  {accountData?.patron.feeAmount || "$0.00"}
                </p>
                <p className="text-sm text-gray-500">Current balance</p>
                {items?.fines && items.fines.length > 0 && (
                  <div className="mt-4 text-left space-y-2">
                    {items.fines.map((item, i) => (
                      <div key={i} className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Screen message from SIP2 */}
      {accountData?.screenMessage && (
        <div className="mt-6 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600">
          {accountData.screenMessage}
        </div>
      )}
    </div>
  );
}
