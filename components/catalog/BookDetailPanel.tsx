"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePatron } from "@/components/patron/PatronContext";

export interface BookInfo {
  id?: number;
  title: string;
  author?: string;
  year?: number | null;
  isbn?: string | null;
  coverUrl?: string | null;
  subjects?: string[];
  publisher?: string | null;
  pages?: number | null;
  editions?: number;
  description?: string;
  genre?: string;
  openLibraryKey?: string;
}

export default function BookDetailPanel({
  book,
  onClose,
  onSelectRelated,
  relatedBooks,
}: {
  book: BookInfo;
  onClose: () => void;
  onSelectRelated?: (book: BookInfo) => void;
  relatedBooks?: BookInfo[];
}) {
  const [imgError, setImgError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [holdStatus, setHoldStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [holdMessage, setHoldMessage] = useState("");
  const [description, setDescription] = useState<string | null>(book.description || null);
  const [descLoading, setDescLoading] = useState(false);
  const { patron, setShowLoginModal } = usePatron();
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch description from our API (which caches to DB)
  useEffect(() => {
    setDescription(book.description || null);
    if (book.description) return;

    const id = book.id;
    const isbn = book.isbn;
    const olkey = book.openLibraryKey;
    if (!id && !isbn) return;

    let cancelled = false;
    setDescLoading(true);

    const params = new URLSearchParams();
    if (id) params.set("id", String(id));
    if (isbn) params.set("isbn", isbn);
    if (olkey) params.set("olkey", olkey);

    fetch(`/api/catalog/description?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.description) {
          setDescription(data.description);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setDescLoading(false); });

    return () => { cancelled = true; };
  }, [book.description, book.id, book.isbn, book.openLibraryKey]);

  // Check if already saved
  useEffect(() => {
    if (!patron) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/patron/saved-books");
        if (res.ok && !cancelled) {
          const data = await res.json();
          const already = data.books?.some(
            (b: { title: string }) => b.title === book.title
          );
          if (already) setSaveStatus("saved");
        }
      } catch {
        // Ignore
      }
    })();
    return () => { cancelled = true; };
  }, [patron, book.title]);

  // Reset state when book changes
  useEffect(() => {
    setImgError(false);
    setSaveStatus("idle");
    setHoldStatus("idle");
    setHoldMessage("");
  }, [book.title]);

  const handleReserve = async () => {
    if (!patron) {
      setShowLoginModal(true);
      return;
    }
    setHoldStatus("loading");
    try {
      const res = await fetch("/api/patron/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: book.isbn || book.title,
          title: book.title,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setHoldStatus("success");
        setHoldMessage(data.message || "Reserve placed!");
      } else {
        setHoldStatus("error");
        setHoldMessage(data.message || data.error || "Could not place reserve");
      }
    } catch {
      setHoldStatus("error");
      setHoldMessage("Unable to connect to library system");
    }
  };

  const handleSave = async () => {
    if (!patron) {
      setShowLoginModal(true);
      return;
    }
    if (saveStatus === "saved") {
      // Unsave
      setSaveStatus("loading");
      try {
        const res = await fetch(
          `/api/patron/saved-books?title=${encodeURIComponent(book.title)}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setSaveStatus("idle");
        } else {
          setSaveStatus("saved");
        }
      } catch {
        setSaveStatus("saved");
      }
      return;
    }

    setSaveStatus("loading");
    try {
      const res = await fetch("/api/patron/saved-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          coverUrl: book.coverUrl,
          year: book.year,
          subjects: book.subjects,
          publisher: book.publisher,
          pages: book.pages,
          openLibraryKey: book.openLibraryKey,
        }),
      });
      if (res.ok) {
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => { panelRef.current?.focus(); }, [book]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const opacUrl = `https://commercepubliclibrarytx.booksys.net/opac/cpltx/index.html#search:ExpertSearch?ST0=T&SF0=${encodeURIComponent(book.title)}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
        style={{ animation: "fadeIn 0.2s ease-out forwards" }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label={`Details for ${book.title}`}
        className="relative z-10 w-full max-w-lg bg-white shadow-2xl overflow-y-auto"
        style={{ animation: "slideInRight 0.3s ease-out forwards" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="sticky top-0 right-0 z-20 float-right m-4 rounded-full bg-white/90 p-2 shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-4">
          {/* Cover */}
          <div className="flex justify-center mb-6">
            <div className="relative aspect-[2/3] w-48 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-lg">
              {book.coverUrl && !imgError ? (
                <Image
                  src={book.coverUrl}
                  alt={`Cover of ${book.title}`}
                  fill
                  sizes="192px"
                  className="object-cover"
                  priority
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary-light to-primary-border p-4 text-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5" className="mb-2">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                  <span className="text-base font-semibold text-primary-dark">{book.title}</span>
                  <span className="mt-1 text-sm text-primary-mid">{book.author}</span>
                </div>
              )}
            </div>
          </div>

          {/* Title & meta */}
          <h2 className="text-xl font-bold text-gray-800 text-center leading-tight">{book.title}</h2>
          <p className="text-center text-gray-500 mt-1">
            {book.author || "Unknown Author"}
            {book.year ? ` · ${book.year}` : ""}
          </p>

          {/* Genre badge */}
          {book.genre && (
            <div className="flex justify-center mt-3">
              <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark">
                {book.genre}
              </span>
            </div>
          )}

          {/* Meta details */}
          <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs text-gray-400">
            {book.publisher && <span>{book.publisher}</span>}
            {book.pages && <span>{book.pages} pages</span>}
            {book.editions && book.editions > 1 && <span>{book.editions} editions</span>}
            {book.isbn && <span>ISBN: {book.isbn}</span>}
          </div>

          {/* Description */}
          {descLoading ? (
            <div className="mt-6 space-y-2 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="h-3 bg-gray-200 rounded w-4/6" />
            </div>
          ) : description ? (
            <p className="mt-6 text-sm text-gray-600 leading-relaxed">{description}</p>
          ) : null}

          {/* Subject tags */}
          {book.subjects && book.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {book.subjects.slice(0, 8).map((s) => (
                <span key={s} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-500">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Hold status message */}
          {holdMessage && (
            <div className={`mt-4 rounded-xl p-3 text-sm ${
              holdStatus === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {holdMessage}
              {holdStatus === "error" && (
                <a
                  href={opacUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 text-xs underline opacity-80"
                >
                  Try reserving directly in the catalog →
                </a>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 mt-6">
            {/* Primary: Reserve */}
            <button
              onClick={handleReserve}
              disabled={holdStatus === "loading" || holdStatus === "success"}
              className={`w-full rounded-xl py-3.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                holdStatus === "success"
                  ? "bg-green-600 text-white"
                  : "bg-[#1D9E75] text-white hover:bg-[#178a65] shadow-lg shadow-[#1D9E75]/25"
              }`}
            >
              {holdStatus === "loading" ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Placing Reserve...
                </>
              ) : holdStatus === "success" ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Reserved!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                  {patron ? "Reserve This Book" : "Sign In to Reserve"}
                </>
              )}
            </button>

            {/* Secondary row: Save + View in Catalog */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saveStatus === "loading"}
                className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  saveStatus === "saved"
                    ? "border-2 border-pink-300 bg-pink-50 text-pink-600"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-pink-300 hover:text-pink-600"
                } disabled:opacity-60`}
              >
                {saveStatus === "loading" ? (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={saveStatus === "saved" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                )}
                {saveStatus === "saved" ? "Saved" : "Save"}
              </button>

              <a
                href={opacUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors text-center flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15,3 21,3 21,9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View in Catalog
              </a>
            </div>
          </div>

          {/* Related books */}
          {relatedBooks && relatedBooks.length > 0 && onSelectRelated && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-bold text-gray-800 mb-4">You Might Also Like</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {relatedBooks.map((rb) => (
                  <RelatedThumb key={rb.isbn || rb.title} book={rb} onClick={onSelectRelated} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function RelatedThumb({ book, onClick }: { book: BookInfo; onClick: (book: BookInfo) => void }) {
  const [imgError, setImgError] = useState(false);
  return (
    <button
      onClick={() => onClick(book)}
      className="group flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
    >
      <div className="relative aspect-[2/3] w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm transition-shadow group-hover:shadow-md">
        {book.coverUrl && !imgError ? (
          <Image
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            fill
            sizes="80px"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light to-primary-border p-1.5 text-center">
            <span className="text-[10px] font-medium text-primary-dark leading-tight line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
      </div>
      <p className="mt-1 w-20 text-[11px] text-gray-500 line-clamp-1 text-center">
        {book.title}
      </p>
    </button>
  );
}
