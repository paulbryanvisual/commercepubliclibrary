"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import CatalogBrowser from "@/components/catalog/CatalogBrowser";

interface SearchResult {
  key?: string;
  title: string;
  author?: string;
  year?: number | null;
  isbn?: string | null;
  coverUrl?: string | null;
  subjects?: string[];
  publisher?: string | null;
  pages?: number | null;
  editions?: number;
  opacUrl?: string;
}

function SearchResultCard({ result }: { result: SearchResult }) {
  const [imgError, setImgError] = useState(false);

  return (
    <a
      href={result.opacUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Cover */}
      <div className="relative aspect-[2/3] w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {result.coverUrl && !imgError ? (
          <Image
            src={result.coverUrl}
            alt={`Cover of ${result.title}`}
            fill
            sizes="80px"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light to-primary-border p-2 text-center">
            <span className="text-[10px] font-medium text-primary-dark leading-tight line-clamp-3">
              {result.title}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
          {result.title}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {result.author || "Unknown Author"}
          {result.year ? ` · ${result.year}` : ""}
        </p>
        {result.publisher && (
          <p className="text-xs text-gray-400 mt-1">{result.publisher}</p>
        )}
        {result.subjects && result.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {result.subjects.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
          {result.pages && <span>{result.pages} pages</span>}
          {result.editions && result.editions > 1 && (
            <span>{result.editions} editions</span>
          )}
          {result.isbn && <span>ISBN: {result.isbn}</span>}
        </div>
      </div>

      {/* OPAC link arrow */}
      <div className="flex items-center text-gray-300">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </a>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogSkeleton() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-10">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-12 bg-gray-200 rounded max-w-2xl" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch search results
  const doSearch = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([]);
      setTotal(0);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/catalog/search?q=${encodeURIComponent(q)}&mode=full&limit=20`
      );
      const data = await res.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search on mount if query param exists
  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery);
    }
  }, [initialQuery, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (q) {
      setQuery(q);
      router.push(`/catalog?q=${encodeURIComponent(q)}`, { scroll: false });
      doSearch(q);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setQuery("");
    setResults([]);
    setTotal(0);
    setSearched(false);
    router.push("/catalog", { scroll: false });
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Hero banner */}
      <div className="relative bg-gradient-to-r from-primary-dark via-primary to-primary-mid overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 800 200" fill="none" aria-hidden="true">
            <rect x="50" y="30" width="40" height="60" rx="4" fill="white" transform="rotate(-5 50 30)" />
            <rect x="110" y="40" width="35" height="55" rx="4" fill="white" transform="rotate(3 110 40)" />
            <rect x="170" y="25" width="38" height="58" rx="4" fill="white" transform="rotate(-8 170 25)" />
            <rect x="650" y="35" width="40" height="60" rx="4" fill="white" transform="rotate(6 650 35)" />
            <rect x="710" y="28" width="36" height="56" rx="4" fill="white" transform="rotate(-3 710 28)" />
            <rect x="580" y="45" width="42" height="62" rx="4" fill="white" transform="rotate(10 580 45)" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-site px-4 md:px-8 py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-medium text-white mb-2">
            {searched ? "Search Results" : "Browse Our Collection"}
          </h1>
          <p className="text-primary-100 text-lg max-w-xl">
            {searched
              ? `Showing results for "${query}"`
              : "Discover your next great read. Search the catalog or explore our curated collection."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-site px-4 md:px-8 py-10">
        {/* Search bar */}
        <form onSubmit={handleSubmit} className="mb-10">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm max-w-2xl">
            <div className="flex-1 flex items-center gap-2 pl-2">
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#73726c" strokeWidth="2" aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search by title, author, subject, or ISBN..."
                className="w-full bg-transparent py-2 text-sm text-gray-700 placeholder-gray-400 outline-none"
                aria-label="Search the catalog"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-mid transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Search Results or Browse Collection */}
        {searched ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-h2 text-gray-800">
                  {loading ? "Searching..." : `${total.toLocaleString()} results found`}
                </h2>
                <button
                  onClick={handleClear}
                  className="text-sm text-primary hover:underline mt-1"
                >
                  ← Back to Browse Collection
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
                    <div className="w-20 aspect-[2/3] rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, i) => (
                  <SearchResultCard key={result.key || i} result={result} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <p className="text-gray-500 text-lg font-medium">No results found</p>
                <p className="text-gray-400 text-sm mt-1">
                  Try a different search term or browse our collection below.
                </p>
                <button
                  onClick={handleClear}
                  className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-mid transition-colors"
                >
                  Browse Collection
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-h2 text-gray-800">Browse Collection</h2>
              <span className="text-sm text-gray-400">30 titles</span>
            </div>
            <p className="text-gray-500 mb-6">
              Click any cover to see details, find similar books, or place a hold.
            </p>
            <CatalogBrowser />
          </div>
        )}
      </div>
    </>
  );
}
