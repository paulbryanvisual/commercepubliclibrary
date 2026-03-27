"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  title: string;
  opacUrl: string;
}

const ATRIUUM_OPAC = "https://commercepubliclibrarytx.booksys.net/opac/cpltx/index.html";

/**
 * CatalogSearch — live search bar that autocompletes from Atriuum.
 * Used on the homepage hero and the catalog page.
 */
export default function CatalogSearch({
  placeholder = "Search books, events, services...",
  buttonText = "Search",
  variant = "hero",
}: {
  placeholder?: string;
  buttonText?: string;
  variant?: "hero" | "catalog";
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(term)}&mode=suggest`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.results || []);
        setIsOpen(data.results.length > 0);
      }
    } catch {
      // Fail silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  };

  // Navigate to catalog search results
  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setIsOpen(false);
    router.push(`/catalog?q=${encodeURIComponent(q.trim())}`);
  };

  // Navigate directly to OPAC for a specific title
  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.title);
    setIsOpen(false);
    // Go to our catalog page with the exact title search
    router.push(`/catalog?q=${encodeURIComponent(suggestion.title)}`);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelectSuggestion(suggestions[activeIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const isHero = variant === "hero";

  return (
    <div className="relative w-full">
      <div
        className={
          isHero
            ? "flex items-center rounded-2xl bg-white p-1.5 shadow-xl shadow-black/10 max-w-xl ring-1 ring-white/20"
            : "flex items-center rounded-xl bg-white p-1 shadow-lg border border-gray-200 max-w-2xl"
        }
      >
        <div className="flex-1 flex items-center gap-2.5 px-4">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isHero ? "#73726c" : "#9ca3af"}
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            className={`w-full bg-transparent py-2.5 text-sm outline-none ${
              isHero
                ? "text-gray-700 placeholder-gray-400"
                : "text-gray-800 placeholder-gray-400"
            }`}
            aria-label="Search the library catalog"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            role="combobox"
          />
          {isLoading && (
            <svg className="animate-spin h-4 w-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
        </div>
        <button
          onClick={() => handleSearch()}
          className={
            isHero
              ? "rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-mid transition-colors shadow-sm"
              : "rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-mid transition-colors"
          }
        >
          {buttonText}
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1.5 w-full max-w-xl rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden"
          role="listbox"
        >
          <div className="py-1">
            {suggestions.slice(0, 8).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSelectSuggestion(s)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-primary-light text-primary-dark"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                role="option"
                aria-selected={i === activeIndex}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 opacity-40"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <span className="truncate">{s.title}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              Powered by Commerce Public Library catalog
            </span>
            <a
              href={`${ATRIUUM_OPAC}#search:ExpertSearch?ST0=Z&SF0=${encodeURIComponent(query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary hover:underline"
            >
              Search in Atriuum →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
