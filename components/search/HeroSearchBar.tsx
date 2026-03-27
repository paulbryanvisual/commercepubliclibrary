"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Suggestion {
  title: string;
  opacUrl: string;
}

export default function HeroSearchBar({
  placeholder = "Search books, events, services...",
  buttonText = "Search",
}: {
  placeholder?: string;
  buttonText?: string;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Fetch suggestions as user types
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(q)}&mode=suggest`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowDropdown(data.results?.length > 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  };

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setShowDropdown(false);
    router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.title);
    setShowDropdown(false);
    setIsSearching(true);
    router.push(`/catalog?q=${encodeURIComponent(suggestion.title)}`);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative max-w-xl">
      <div className="flex items-center rounded-2xl bg-white p-1.5 shadow-xl shadow-black/10 ring-1 ring-white/20">
        <div className="flex-1 flex items-center gap-2.5 px-4">
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
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            placeholder={placeholder}
            className="w-full bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none"
            aria-label="Search the library catalog"
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-mid transition-colors shadow-sm disabled:opacity-70"
        >
          {isSearching ? (
            <svg className="animate-spin h-4 w-4 mx-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            buttonText
          )}
        </button>
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden z-50"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelectSuggestion(s)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                i === selectedIndex
                  ? "bg-primary-light text-primary-dark"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              role="option"
              aria-selected={i === selectedIndex}
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
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleSearch}
              className="text-xs text-primary font-medium hover:underline"
            >
              See all results for &ldquo;{query}&rdquo; →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
