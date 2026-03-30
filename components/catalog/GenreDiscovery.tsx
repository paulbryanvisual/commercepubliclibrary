"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { type Genre } from "@/lib/catalog/books";

/** Lightweight book shape for surprise picks (from API) */
interface SurpriseBook {
  id: number;
  title: string;
  author: string | null;
  coverUrl: string | null;
  genre: string;
  isbn: string | null;
  year: number | null;
  subjects: string[];
  description: string | null;
  openLibraryKey: string | null;
}

/** The shape the parent expects when a book is selected */
interface BookInfo {
  title: string;
  author?: string;
  year?: number | null;
  isbn?: string | null;
  coverUrl?: string | null;
  subjects?: string[];
  description?: string;
  genre?: string;
  openLibraryKey?: string;
}

interface GenreTile {
  genre: Genre;
  label: string;
  gradient: string;
  imageUrl: string;
  description: string;
}

const genreTiles: GenreTile[] = [
  {
    genre: "Fiction",
    label: "Fiction",

    gradient: "from-emerald-600 to-teal-700",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop&q=80",
    description: "Stories that transport you",
  },
  {
    genre: "Mystery",
    label: "Mystery & Thriller",

    gradient: "from-slate-700 to-gray-900",
    imageUrl: "https://images.unsplash.com/photo-1587876931567-564ce588bfbd?w=600&h=400&fit=crop&q=80",
    description: "Twists you won't see coming",
  },
  {
    genre: "Sci-Fi",
    label: "Sci-Fi & Fantasy",
    gradient: "from-indigo-600 to-purple-700",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop&q=80",
    description: "Worlds beyond imagination",
  },
  {
    genre: "Biography",
    label: "Biography & Memoir",
    gradient: "from-amber-600 to-orange-700",
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop&q=80",
    description: "Real lives, real stories",
  },
  {
    genre: "Kids",
    label: "Kids",
    gradient: "from-green-500 to-emerald-600",
    imageUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop&q=80",
    description: "Adventures for young readers",
  },
  {
    genre: "Teens",
    label: "Young Adult",
    gradient: "from-violet-600 to-purple-700",
    imageUrl: "https://images.unsplash.com/photo-1529590003495-b2646e2718bf?w=600&h=400&fit=crop&q=80",
    description: "Bold stories for bold readers",
  },
  {
    genre: "Nonfiction",
    label: "Nonfiction",
    gradient: "from-sky-600 to-blue-700",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&q=80",
    description: "Expand your mind",
  },
  {
    genre: "Spanish" as Genre,
    label: "En Español",
    gradient: "from-red-600 to-yellow-600",
    imageUrl: "https://images.unsplash.com/photo-1551029506-0807df4e2031?w=600&h=400&fit=crop&q=80",
    description: "Libros en español",
  },
];

export default function GenreDiscovery({
  onSelectGenre,
  onSelectBook,
}: {
  onSelectGenre: (genre: string) => void;
  onSelectBook: (book: BookInfo) => void;
}) {
  return (
    <div>
      {/* Genre Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
        {genreTiles.map((tile) => (
          <GenreTileCard key={tile.genre} tile={tile} onClick={() => onSelectGenre(tile.genre)} />
        ))}
      </div>

      {/* Surprise Me / Staff Picks */}
      <SurpriseSection onSelectBook={onSelectBook} />
    </div>
  );
}

function GenreTileCard({ tile, onClick }: { tile: GenreTile; onClick: () => void }) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl aspect-[4/3] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Background image */}
      {!imgErr ? (
        <Image
          src={tile.imageUrl}
          alt={tile.label}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          onError={() => setImgErr(true)}
        />
      ) : null}

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${tile.gradient} ${imgErr ? "opacity-100" : "opacity-70"} group-hover:opacity-80 transition-opacity`} />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <h3 className="text-base md:text-lg font-bold text-white leading-tight">
          {tile.label}
        </h3>
        <p className="text-xs text-white/70 mt-0.5 group-hover:text-white/90 transition-colors">
          {tile.description}
        </p>
      </div>

      {/* Hover shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </button>
  );
}

/** Width of each book card + gap in the roulette strip */
const CARD_W = 108; // 96px card + 12px gap
/** Optimized cover dimensions for roulette cards (96×144 @ 2x) */
const COVER_W = 192;
const COVER_H = 288;

/**
 * Build a Next.js /_next/image optimized URL so the browser fetches a
 * properly sized image instead of the full-res Open Library cover.
 */
function optimizedCoverSrc(coverUrl: string): string {
  return `/_next/image?url=${encodeURIComponent(coverUrl)}&w=${COVER_W}&q=75`;
}

/**
 * Eagerly load images into browser cache using Image objects.
 * Returns a promise that resolves when all images are loaded (or failed).
 */
function preloadImages(urls: string[]): Promise<void> {
  return new Promise((resolve) => {
    let remaining = urls.length;
    if (remaining === 0) { resolve(); return; }
    const done = () => { remaining--; if (remaining <= 0) resolve(); };
    urls.forEach((url) => {
      const img = new window.Image();
      img.onload = done;
      img.onerror = done;
      img.src = url;
    });
    // Safety timeout — don't wait forever
    setTimeout(resolve, 8000);
  });
}

function SurpriseSection({ onSelectBook }: { onSelectBook: (book: BookInfo) => void }) {
  const [preloadedBooks, setPreloadedBooks] = useState<SurpriseBook[]>([]);
  const [rouletteBooks, setRouletteBooks] = useState<SurpriseBook[]>([]);
  const [imagesReady, setImagesReady] = useState(false);
  const [surpriseBook, setSurpriseBook] = useState<SurpriseBook | null>(null);
  const [phase, setPhase] = useState<"idle" | "spinning" | "landed">("idle");
  const [stripOffset, setStripOffset] = useState(0);
  const [winnerIdx, setWinnerIdx] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFetched = useRef(false);

  // Fetch books + preload images on mount — show static preview strip once loaded
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetch(`/api/catalog/browse?genre=all&limit=20&random=true`)
      .then((r) => r.json())
      .then(async (data) => {
        const books: SurpriseBook[] = data.books || [];
        if (books.length === 0) return;
        setPreloadedBooks(books);

        // Actually load all cover images into browser cache
        const coverUrls = books
          .map((b) => b.coverUrl)
          .filter(Boolean)
          .map((url) => optimizedCoverSrc(url!));
        await preloadImages(coverUrls);

        // Show the books as a static preview strip
        setRouletteBooks(books);
        setImagesReady(true);
      })
      .catch(() => {});
  }, []);

  const handleSurprise = useCallback(() => {
    const startSpin = (books: SurpriseBook[]) => {
      if (books.length === 0) { setPhase("idle"); return; }

      const tripled = [...books, ...books, ...books];
      setRouletteBooks(tripled);
      setStripOffset(0);

      const winner = books.length + Math.floor(Math.random() * books.length);
      setWinnerIdx(winner);

      // Double-rAF so the strip renders at offset 0 first, then transitions
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setStripOffset(winner * CARD_W);
        });
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSurpriseBook(books[winner % books.length]);
        setPhase("landed");

        // Pre-fetch a fresh batch for next spin (images load in background)
        fetch(`/api/catalog/browse?genre=all&limit=20&random=true`)
          .then((r) => r.json())
          .then(async (data) => {
            const fresh: SurpriseBook[] = data.books || [];
            if (fresh.length > 0) {
              setPreloadedBooks(fresh);
              const urls = fresh.map((b) => b.coverUrl).filter(Boolean).map((u) => optimizedCoverSrc(u!));
              await preloadImages(urls);
            }
          })
          .catch(() => {});
      }, 3600);
    };

    setPhase("spinning");
    setSurpriseBook(null);

    if (preloadedBooks.length > 0 && imagesReady) {
      // Instant — images already in browser cache
      startSpin(preloadedBooks);
    } else {
      // Fallback: fetch and load now
      fetch(`/api/catalog/browse?genre=all&limit=20&random=true`)
        .then((r) => r.json())
        .then(async (data) => {
          const books: SurpriseBook[] = data.books || [];
          const urls = books.map((b) => b.coverUrl).filter(Boolean).map((u) => optimizedCoverSrc(u!));
          await preloadImages(urls);
          startSpin(books);
        })
        .catch(() => setPhase("idle"));
    }
  }, [preloadedBooks, imagesReady]);

  const handleClick = useCallback(() => {
    if (!surpriseBook) return;
    onSelectBook({
      title: surpriseBook.title,
      author: surpriseBook.author || undefined,
      year: surpriseBook.year,
      isbn: surpriseBook.isbn,
      coverUrl: surpriseBook.coverUrl,
      subjects: surpriseBook.subjects,
      description: surpriseBook.description || undefined,
      genre: surpriseBook.genre,
      openLibraryKey: surpriseBook.openLibraryKey || undefined,
    });
  }, [surpriseBook, onSelectBook]);

  const isSpinning = phase === "spinning";

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 overflow-hidden">
      {/* Side-by-side layout: controls left, wheel right */}
      <div className="flex flex-col md:flex-row">
        {/* Left panel: title, buttons, winner */}
        <div className="flex-shrink-0 p-6 md:p-8 md:w-[320px] flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <span className={`text-2xl ${isSpinning ? "animate-bounce" : ""}`}>🎲</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Feeling Adventurous?</h3>
              <p className="text-xs text-gray-500">Let fate pick your next read</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <button
              onClick={handleSurprise}
              disabled={isSpinning}
              className="rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 px-6 py-3 text-sm font-bold text-white hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:hover:scale-100 flex items-center gap-2"
            >
              {isSpinning ? (
                <>
                  <span className="animate-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                  Spinning...
                </>
              ) : phase === "landed" ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M1 4v6h6M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                  </svg>
                  Spin Again!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                  Surprise Me!
                </>
              )}
            </button>
          </div>

          {/* Winner card inline */}
          {surpriseBook && phase === "landed" && (
            <button
              onClick={handleClick}
              className="mt-4 flex items-center gap-3 rounded-xl bg-white border-2 border-amber-200 p-3 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:border-amber-300 transition-all group text-left animate-[fadeScaleIn_0.4s_ease-out]"
            >
              <div className="relative aspect-[2/3] w-14 shrink-0 rounded-lg overflow-hidden bg-gray-100 shadow-md">
                {surpriseBook.coverUrl ? (
                  <Image src={surpriseBook.coverUrl} alt={surpriseBook.title} fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-rose-100 p-1">
                    <span className="text-[8px] font-semibold text-amber-700 text-center line-clamp-2">{surpriseBook.title}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-amber-600 font-bold mb-0.5">Your pick!</p>
                <p className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-[#1D9E75] transition-colors">
                  {surpriseBook.title}
                </p>
                <p className="text-xs text-gray-500">{surpriseBook.author}</p>
                <p className="text-[10px] text-primary font-medium mt-1">Tap for details →</p>
              </div>
            </button>
          )}
        </div>

        {/* Right panel: roulette wheel */}
        <div className="relative flex-1 min-h-[220px] overflow-hidden">
          {/* Center pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-amber-500" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[14px] border-l-transparent border-r-transparent border-b-amber-500" />

          {/* Gradient fade edges */}
          <div className="absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-amber-50/90 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 z-10 bg-gradient-to-l from-rose-50/90 to-transparent pointer-events-none" />

          {rouletteBooks.length > 0 ? (
            <div
              ref={stripRef}
              className="flex items-center gap-3 h-full px-4"
              style={{
                transform: `translateX(calc(50% - ${stripOffset}px - ${CARD_W / 2}px))`,
                transition: stripOffset === 0
                  ? "none"
                  : "transform 3.5s cubic-bezier(0.15, 0.82, 0.25, 1)",
              }}
            >
              {rouletteBooks.map((book, i) => {
                const isWinner = phase === "landed" && i === winnerIdx;
                return (
                  <div
                    key={`${book.id}-${i}`}
                    className={`flex-shrink-0 transition-all duration-500 ${
                      isWinner ? "scale-110 z-20" : ""
                    }`}
                    style={{ width: 96 }}
                  >
                    <div className={`relative aspect-[2/3] w-full rounded-xl overflow-hidden border-2 shadow-md transition-all duration-500 ${
                      isWinner
                        ? "border-amber-400 shadow-amber-500/40 ring-4 ring-amber-400/30"
                        : "border-gray-200/60"
                    }`}>
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt={book.title}
                          width={96}
                          height={144}
                          sizes="96px"
                          className="object-cover w-full h-full"
                          loading="eager"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-rose-100 p-2">
                          <span className="text-[10px] font-semibold text-amber-700 text-center line-clamp-3">{book.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="flex gap-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[96px] aspect-[2/3] rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 opacity-25"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
