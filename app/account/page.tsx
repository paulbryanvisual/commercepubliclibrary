"use client";

import { useState, useEffect, useCallback } from "react";
import { usePatron } from "@/components/patron/PatronContext";
import Link from "next/link";
import Image from "next/image";

interface CheckedOutItem {
  title: string;
  barcode: string;
  callNumber: string;
  dueDate: string;
  checkoutDate: string;
  isOverdue: boolean;
  author: string;
  materialType: string;
  renewalCount: string;
  finesOwed: string;
}

interface AccountData {
  patron: {
    name: string;
    email?: string;
    phone?: string;
    cardNumber: string;
    patronClass?: string;
    cardExpires?: string;
    cardExpired?: boolean;
    isBlocked?: boolean;
    address?: string;
  };
  counts: { itemsOut: number; overdue: number };
  fines: { total: string; projectedLateFees: string };
  items: CheckedOutItem[];
}

interface SavedBook {
  id: string;
  title: string;
  author?: string;
  isbn?: string;
  coverUrl?: string;
  year?: number;
  subjects?: string[];
  publisher?: string;
  savedAt: string;
}

const tabs = ["Checkouts", "My List", "Account Info"] as const;
type Tab = (typeof tabs)[number];

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(parts[0]) - 1]} ${parseInt(parts[1])}, ${parts[2]}`;
  }
  return dateStr;
}

function daysUntilDue(dateStr: string): number {
  if (!dateStr) return 999;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return 999;
  const due = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function DueBadge({ dueDate, isOverdue }: { dueDate: string; isOverdue: boolean }) {
  const days = daysUntilDue(dueDate);

  if (isOverdue || days < 0) {
    const overdueDays = Math.abs(days);
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        {overdueDays} day{overdueDays !== 1 ? "s" : ""} overdue
      </span>
    );
  }

  if (days <= 3) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        Due {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}
      </span>
    );
  }

  return (
    <span className="text-xs text-gray-500">
      Due {formatDate(dueDate)}
    </span>
  );
}

export default function AccountPage() {
  const { patron, isLoading: patronLoading, setShowLoginModal, logout } = usePatron();
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Checkouts");
  const [renewingItem, setRenewingItem] = useState<string | null>(null);
  const [renewResult, setRenewResult] = useState<{ barcode: string; ok: boolean; msg: string } | null>(null);
  const [savedBooks, setSavedBooks] = useState<SavedBook[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [removingBook, setRemovingBook] = useState<string | null>(null);

  const fetchSavedBooks = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await fetch("/api/patron/saved-books");
      if (res.ok) {
        const data = await res.json();
        setSavedBooks(data.books || []);
      }
    } catch {
      // Silently fail
    } finally {
      setSavedLoading(false);
    }
  }, []);

  const removeSavedBook = async (id: string) => {
    setRemovingBook(id);
    try {
      const res = await fetch(`/api/patron/saved-books?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setSavedBooks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch {
      // Silently fail
    } finally {
      setRemovingBook(null);
    }
  };

  const fetchAccount = useCallback(async () => {
    setIsLoading(true);
    setFetchError(false);
    try {
      const res = await fetch("/api/patron/account");
      if (res.ok) {
        const data = await res.json();
        setAccountData(data);
      } else {
        setFetchError(true);
      }
    } catch {
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (patron) {
      fetchAccount();
      fetchSavedBooks();
    }
  }, [patron, fetchAccount, fetchSavedBooks]);

  const handleRenew = async (barcode: string, title: string) => {
    setRenewingItem(barcode);
    setRenewResult(null);
    try {
      const res = await fetch("/api/patron/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: barcode }),
      });
      const data = await res.json();
      setRenewResult({
        barcode,
        ok: res.ok,
        msg: res.ok ? `"${title}" renewed successfully!` : (data.message || "Could not renew this item"),
      });
      if (res.ok) fetchAccount();
    } catch {
      setRenewResult({ barcode, ok: false, msg: "Error connecting to library system" });
    } finally {
      setRenewingItem(null);
    }
  };

  // ── Loading ──
  if (patronLoading) {
    return (
      <div className="mx-auto max-w-site px-4 md:px-8 py-24 text-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent mx-auto" />
      </div>
    );
  }

  // ── Not logged in ──
  if (!patron) {
    return (
      <div className="mx-auto max-w-site px-4 md:px-8 py-16">
        <div className="max-w-sm mx-auto text-center">
          <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#e8f5f0] to-[#d0ebe3] flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">My Account</h1>
          <p className="text-gray-500 mb-8">
            Sign in to view your checkouts, holds, and account details.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="w-full rounded-xl bg-[#1D9E75] py-3.5 text-sm font-semibold text-white hover:bg-[#178a65] transition-colors shadow-lg shadow-[#1D9E75]/25"
          >
            Sign In with Library Card
          </button>
          <p className="mt-8 text-sm text-gray-400">
            Don&apos;t have a library card?{" "}
            <Link href="/get-card" className="text-[#1D9E75] font-medium hover:underline">
              Apply for one free →
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Logged in ──
  const overdueItems = accountData?.items.filter((i) => i.isOverdue) || [];
  const currentItems = accountData?.items.filter((i) => !i.isOverdue) || [];
  const firstName = patron.name.split(/[\s,]+/).filter(Boolean)[patron.name.includes(",") ? 1 : 0] || patron.name;

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8 py-8 md:py-12">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1D9E75] to-[#114d3e] flex items-center justify-center shadow-lg shadow-[#1D9E75]/20">
            <span className="text-xl font-bold text-white">
              {firstName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Welcome, {firstName}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Card ending in ...{patron.cardNumber.slice(-4)}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-all"
        >
          Sign Out
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
          <p className="text-2xl md:text-3xl font-bold text-[#1D9E75]">
            {accountData?.counts.itemsOut ?? "—"}
          </p>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Checked Out</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
          <p className={`text-2xl md:text-3xl font-bold ${(accountData?.counts.overdue ?? 0) > 0 ? "text-red-600" : "text-gray-300"}`}>
            {accountData?.counts.overdue ?? "—"}
          </p>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Overdue</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
          <p className="text-2xl md:text-3xl font-bold text-gray-800">
            {accountData?.fines.total || "$0.00"}
          </p>
          <p className="text-xs md:text-sm text-gray-500 mt-1">Fines</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#1D9E75] text-[#1D9E75]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-[#1D9E75] border-t-transparent" />
        </div>
      )}

      {/* ── Fetch Error ── */}
      {fetchError && !isLoading && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-center">
          <p className="text-sm text-amber-800 mb-3">Unable to load account details right now.</p>
          <button
            onClick={fetchAccount}
            className="text-sm font-medium text-amber-700 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Renew result toast ── */}
      {renewResult && (
        <div
          className={`rounded-xl p-4 mb-5 flex items-center justify-between text-sm ${
            renewResult.ok
              ? "bg-green-50 border border-green-100 text-green-800"
              : "bg-red-50 border border-red-100 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {renewResult.ok ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
            )}
            {renewResult.msg}
          </div>
          <button onClick={() => setRenewResult(null)} className="text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* ── Checkouts Tab ── */}
      {!isLoading && !fetchError && activeTab === "Checkouts" && (
        <div className="space-y-6">
          {/* Overdue section */}
          {overdueItems.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-3 uppercase tracking-wider">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                Overdue ({overdueItems.length})
              </h2>
              <div className="space-y-2">
                {overdueItems.map((item) => (
                  <ItemCard key={item.barcode} item={item} onRenew={handleRenew} renewingItem={renewingItem} variant="overdue" />
                ))}
              </div>
            </div>
          )}

          {/* Current checkouts */}
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              {overdueItems.length > 0 ? "Current" : "Checked Out"} ({currentItems.length})
            </h2>
            {currentItems.length > 0 ? (
              <div className="space-y-2">
                {currentItems.map((item) => (
                  <ItemCard key={item.barcode} item={item} onRenew={handleRenew} renewingItem={renewingItem} variant="normal" />
                ))}
              </div>
            ) : accountData && overdueItems.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-1">No items checked out</p>
                <Link href="/catalog" className="text-sm text-[#1D9E75] font-medium hover:underline">
                  Browse the catalog →
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── My List Tab ── */}
      {!isLoading && activeTab === "My List" && (
        <div>
          {savedLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-6 w-6 rounded-full border-2 border-[#1D9E75] border-t-transparent" />
            </div>
          ) : savedBooks.length > 0 ? (
            <div className="space-y-3">
              {savedBooks.map((book) => (
                <SavedBookCard
                  key={book.id}
                  book={book}
                  onRemove={removeSavedBook}
                  isRemoving={removingBook === book.id}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-pink-50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.5">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">Your reading list is empty</p>
              <p className="text-xs text-gray-400 mb-4">
                Save books from the catalog to keep track of what you want to read.
              </p>
              <Link href="/catalog" className="text-sm text-[#1D9E75] font-medium hover:underline">
                Browse the catalog →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Account Info Tab ── */}
      {!isLoading && !fetchError && activeTab === "Account Info" && accountData && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              <InfoRow label="Full Name" value={accountData.patron.name} />
              <InfoRow label="Card Number" value={accountData.patron.cardNumber} />
              <InfoRow label="Email" value={accountData.patron.email} />
              <InfoRow label="Phone" value={accountData.patron.phone} />
              <InfoRow label="Address" value={accountData.patron.address} />
              <InfoRow label="Patron Type" value={accountData.patron.patronClass} />
              <InfoRow
                label="Card Expires"
                value={accountData.patron.cardExpires ? formatDate(accountData.patron.cardExpires) : undefined}
                warn={accountData.patron.cardExpired}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Need to make changes?</h3>
            <p className="text-sm text-gray-500 mb-2">
              Visit the library or call us to update your address, phone, email, or reset your password.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="tel:9038866858"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                (903) 886-6858
              </a>
              <a
                href="mailto:director@commercepubliclibrary.org"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Email Us
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Subcomponents ── */

function ItemCard({
  item,
  onRenew,
  renewingItem,
  variant,
}: {
  item: CheckedOutItem;
  onRenew: (barcode: string, title: string) => void;
  renewingItem: string | null;
  variant: "overdue" | "normal";
}) {
  const isOverdue = variant === "overdue";
  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${
        isOverdue
          ? "border-red-100 bg-red-50/50"
          : "border-gray-100 bg-white shadow-sm"
      }`}
    >
      {/* Book icon */}
      <div
        className={`hidden sm:flex h-14 w-10 shrink-0 rounded-lg items-center justify-center ${
          isOverdue ? "bg-red-100" : "bg-gradient-to-br from-[#e8f5f0] to-[#d0ebe3]"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isOverdue ? "#dc2626" : "#1D9E75"}
          strokeWidth="1.5"
        >
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
        {item.author && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{item.author.replace(/,\s*$/, "")}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <DueBadge dueDate={item.dueDate} isOverdue={item.isOverdue} />
          {item.materialType && item.materialType !== "Book" && (
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{item.materialType}</span>
          )}
          {parseInt(item.renewalCount) > 0 && (
            <span className="text-xs text-gray-400">Renewed {item.renewalCount}×</span>
          )}
        </div>
      </div>

      {/* Renew button */}
      <button
        onClick={() => onRenew(item.barcode, item.title)}
        disabled={renewingItem === item.barcode}
        className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all disabled:opacity-50 ${
          isOverdue
            ? "bg-red-600 text-white hover:bg-red-700 shadow-sm"
            : "border border-gray-200 text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75]"
        }`}
      >
        {renewingItem === item.barcode ? (
          <span className="flex items-center gap-1.5">
            <span className="animate-spin h-3 w-3 rounded-full border border-current border-t-transparent" />
            Renewing
          </span>
        ) : isOverdue ? (
          "Renew Now"
        ) : (
          "Renew"
        )}
      </button>
    </div>
  );
}

function SavedBookCard({
  book,
  onRemove,
  isRemoving,
}: {
  book: SavedBook;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const opacUrl = `https://commercepubliclibrarytx.booksys.net/opac/cpltx/index.html#search:ExpertSearch?ST0=T&SF0=${encodeURIComponent(book.title)}`;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex gap-4">
      {/* Cover */}
      <div className="relative aspect-[2/3] w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {book.coverUrl && !imgError ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="64px"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light to-primary-border p-1.5 text-center">
            <span className="text-[9px] font-medium text-primary-dark leading-tight line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{book.title}</p>
        {book.author && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{book.author}</p>
        )}
        {book.year && (
          <p className="text-xs text-gray-400">{book.year}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <a
            href={opacUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[#1D9E75] hover:underline"
          >
            Reserve in Catalog →
          </a>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(book.id)}
        disabled={isRemoving}
        className="self-start shrink-0 p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
        title="Remove from list"
      >
        {isRemoving ? (
          <span className="animate-spin h-4 w-4 block rounded-full border border-gray-300 border-t-transparent" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        )}
      </button>
    </div>
  );
}

function InfoRow({ label, value, warn }: { label: string; value?: string; warn?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${warn ? "text-red-600" : "text-gray-800"}`}>
        {value}
        {warn && " (Expired)"}
      </span>
    </div>
  );
}
