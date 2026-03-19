import type { Metadata } from "next";
import CatalogBrowser from "@/components/catalog/CatalogBrowser";

export const metadata: Metadata = {
  title: "Search the Catalog",
  description:
    "Search the Commerce Public Library catalog — find books, ebooks, DVDs, audiobooks, and more. Real-time availability and AI-powered search.",
};

export default function CatalogPage() {
  return (
    <>
      {/* Hero banner */}
      <div className="relative bg-gradient-to-r from-primary-dark via-primary to-primary-mid overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg
            className="h-full w-full"
            viewBox="0 0 800 200"
            fill="none"
            aria-hidden="true"
          >
            {/* Decorative book shapes */}
            <rect x="50" y="30" width="40" height="60" rx="4" fill="white" transform="rotate(-5 50 30)" />
            <rect x="110" y="40" width="35" height="55" rx="4" fill="white" transform="rotate(3 110 40)" />
            <rect x="170" y="25" width="38" height="58" rx="4" fill="white" transform="rotate(-8 170 25)" />
            <rect x="650" y="35" width="40" height="60" rx="4" fill="white" transform="rotate(6 650 35)" />
            <rect x="710" y="28" width="36" height="56" rx="4" fill="white" transform="rotate(-3 710 28)" />
            <rect x="580" y="45" width="42" height="62" rx="4" fill="white" transform="rotate(10 580 45)" />
            <rect x="300" y="120" width="30" height="48" rx="3" fill="white" transform="rotate(-12 300 120)" />
            <rect x="460" y="110" width="34" height="52" rx="3" fill="white" transform="rotate(7 460 110)" />
          </svg>
        </div>
        <div className="relative mx-auto max-w-site px-4 md:px-8 py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-medium text-white mb-2">
            Browse Our Collection
          </h1>
          <p className="text-primary-100 text-lg max-w-xl">
            Discover your next great read. Search the catalog or explore our
            curated collection of books, ebooks, audiobooks, and more.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-site px-4 md:px-8 py-10">
        {/* Search bar */}
        <div className="mb-10">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm max-w-2xl">
            {/* Type selector */}
            <select className="rounded-lg border-0 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 outline-none focus:ring-1 focus:ring-primary">
              <option>All Fields</option>
              <option>Title</option>
              <option>Author</option>
              <option>Subject</option>
              <option>ISBN</option>
            </select>
            <div className="flex-1 flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#73726c"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, author, subject, or ISBN..."
                className="w-full bg-transparent py-2 text-sm text-gray-700 placeholder-gray-400 outline-none"
                aria-label="Search the catalog"
              />
            </div>
            <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-mid transition-colors">
              Search
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-2 mt-3">
            <button className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark">
              Keyword
            </button>
            <button className="rounded-full bg-purple-light px-3 py-1 text-xs font-medium text-purple">
              Ask AI
            </button>
          </div>
        </div>

        {/* Browse Collection */}
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
      </div>
    </>
  );
}
