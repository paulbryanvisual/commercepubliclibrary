"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { type Genre } from "@/lib/catalog/books";
import { proxyCoverUrl } from "@/lib/catalog/cover-proxy";

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
  emoji: string;
  gradient: string;
  imageUrl: string;
  description: string;
}

const genreTiles: GenreTile[] = [
  {
    genre: "Fiction",
    label: "Fiction",
    emoji: "📖",
    gradient: "from-emerald-600 to-teal-700",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop&q=80",
    description: "Stories that transport you",
  },
  {
    genre: "Mystery",
    label: "Mystery & Thriller",
    emoji: "🔍",
    gradient: "from-slate-700 to-gray-900",
    imageUrl: "https://images.unsplash.com/photo-1587876931567-564ce588bfbd?w=600&h=400&fit=crop&q=80",
    description: "Twists you won't see coming",
  },
  {
    genre: "Romance",
    label: "Romance",
    emoji: "💕",
    gradient: "from-rose-500 to-pink-600",
    imageUrl: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=600&h=400&fit=crop&q=80",
    description: "Love stories that linger",
  },
  {
    genre: "Sci-Fi",
    label: "Sci-Fi & Fantasy",
    emoji: "🚀",
    gradient: "from-indigo-600 to-purple-700",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop&q=80",
    description: "Worlds beyond imagination",
  },
  {
    genre: "Biography",
    label: "Biography & Memoir",
    emoji: "👤",
    gradient: "from-amber-600 to-orange-700",
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop&q=80",
    description: "Real lives, real stories",
  },
  {
    genre: "Kids",
    label: "Kids",
    emoji: "🌈",
    gradient: "from-green-500 to-emerald-600",
    imageUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop&q=80",
    description: "Adventures for young readers",
  },
  {
    genre: "Teens",
    label: "Young Adult",
    emoji: "⚡",
    gradient: "from-violet-600 to-purple-700",
    imageUrl: "https://images.unsplash.com/photo-1529590003495-b2646e2718bf?w=600&h=400&fit=crop&q=80",
    description: "Bold stories for bold readers",
  },
  {
    genre: "Nonfiction",
    label: "Nonfiction",
    emoji: "🧠",
    gradient: "from-sky-600 to-blue-700",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&q=80",
    description: "Expand your mind",
  },
];

export default function GenreDiscovery({
  onSelectGenre,
  onSelectBook,
}: {
  onSelectGenre: (genre: Genre) => void;
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
        <span className="text-2xl mb-1 group-hover:scale-110 transition-transform origin-left">
          {tile.emoji}
        </span>
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

function SurpriseSection({ onSelectBook }: { onSelectBook: (book: BookInfo) => void }) {
  const [rouletteBooks, setRouletteBooks] = useState<SurpriseBook[]>([]);
  const [surpriseBook, setSurpriseBook] = useState<SurpriseBook | null>(null);
  const [phase, setPhase] = useState<"idle" | "spinning" | "slowing" | "landed">("idle");
  const [activeIndex, setActiveIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  const handleSurprise = useCallback(async () => {
    setPhase("spinning");
    setSurpriseBook(null);
    try {
      const res = await fetch(`/api/catalog/browse?genre=all&limit=20&random=true`);
      const data = await res.json();
      const books: SurpriseBook[] = data.books || [];
      if (books.length === 0) { setPhase("idle"); return; }

      // Double the array so the strip feels infinite
      const doubled = [...books, ...books];
      setRouletteBooks(doubled);

      // Phase 1: fast spin (80ms per step, 20 steps)
      let step = 0;
      const totalFast = 20;
      const totalSlow = 8;
      const winnerIdx = Math.floor(Math.random() * books.length);

      const fastInterval = setInterval(() => {
        setActiveIndex(step % doubled.length);
        step++;
        if (step >= totalFast) {
          clearInterval(fastInterval);
          setPhase("slowing");

          // Phase 2: decelerate (interval grows each step)
          let slowStep = 0;
          const runSlow = () => {
            const idx = (totalFast + slowStep) % doubled.length;
            setActiveIndex(idx);
            slowStep++;
            if (slowStep >= totalSlow) {
              // Land on winner
              setActiveIndex(winnerIdx);
              setSurpriseBook(books[winnerIdx]);
              setPhase("landed");
              return;
            }
            setTimeout(runSlow, 120 + slowStep * 60);
          };
          runSlow();
        }
      }, 70);
    } catch {
      setPhase("idle");
    }
  }, []);

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

  const isAnimating = phase === "spinning" || phase === "slowing";

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-amber-50 via-white to-rose-50 overflow-hidden">
      <div className="p-6 md:p-8 pb-0">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <span className={`text-3xl ${isAnimating ? "animate-bounce" : ""}`}>🎲</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Feeling Adventurous?</h3>
            <p className="text-sm text-gray-500">Spin the roulette and let fate pick your next read</p>
          </div>
        </div>
      </div>

      {/* Roulette strip */}
      <div className="relative mt-4 h-48 overflow-hidden">
        {/* Gradient fade edges */}
        <div className="absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-amber-50 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-rose-50 to-transparent pointer-events-none" />

        {rouletteBooks.length > 0 ? (
          <div
            ref={stripRef}
            className="flex items-center gap-4 px-8 h-full transition-transform"
            style={{
              transform: `translateX(calc(50% - ${activeIndex * 140}px - 60px))`,
              transition: phase === "spinning" ? "transform 70ms linear" : phase === "slowing" ? "transform 200ms ease-out" : "transform 500ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {rouletteBooks.map((book, i) => {
              const isActive = i === activeIndex;
              return (
                <div
                  key={`${book.id}-${i}`}
                  className={`flex-shrink-0 transition-all duration-300 ${
                    isActive && phase === "landed"
                      ? "scale-110 z-20"
                      : isActive
                        ? "scale-105 opacity-100"
                        : "scale-90 opacity-40"
                  }`}
                  style={{ width: 120 }}
                >
                  <div className={`relative aspect-[2/3] w-full rounded-xl overflow-hidden border-2 shadow-lg transition-all duration-300 ${
                    isActive && phase === "landed"
                      ? "border-amber-400 shadow-amber-500/30 ring-4 ring-amber-400/30"
                      : isActive
                        ? "border-rose-300 shadow-rose-500/20"
                        : "border-gray-200"
                  }`}>
                    {book.coverUrl ? (
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-rose-100 p-2">
                        <span className="text-xs font-semibold text-amber-700 text-center line-clamp-3">{book.title}</span>
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
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-[100px] aspect-[2/3] rounded-xl bg-gradient-to-br from-amber-100 to-rose-100 opacity-30"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom area: button + result */}
      <div className="p-6 md:p-8 pt-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleSurprise}
            disabled={isAnimating}
            className="rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 px-8 py-4 text-base font-bold text-white hover:shadow-xl hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:hover:scale-100 flex items-center gap-3"
          >
            {isAnimating ? (
              <>
                <span className="animate-spin h-5 w-5 rounded-full border-[3px] border-white border-t-transparent" />
                Spinning...
              </>
            ) : phase === "landed" ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M1 4v6h6M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                </svg>
                Spin Again!
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                Surprise Me!
              </>
            )}
          </button>

          {/* Winner card */}
          {surpriseBook && phase === "landed" && (
            <button
              onClick={handleClick}
              className="flex items-center gap-4 rounded-xl bg-white border-2 border-amber-200 p-4 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:border-amber-300 transition-all group animate-[fadeScaleIn_0.4s_ease-out]"
            >
              <div className="relative aspect-[2/3] w-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 shadow-md">
                {surpriseBook.coverUrl ? (
                  <Image src={surpriseBook.coverUrl} alt={surpriseBook.title} fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-rose-100 p-1">
                    <span className="text-[9px] font-semibold text-amber-700 text-center line-clamp-3">{surpriseBook.title}</span>
                  </div>
                )}
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs text-amber-600 font-bold mb-0.5 flex items-center gap-1">
                  <span>Your surprise pick!</span>
                </p>
                <p className="text-base font-bold text-gray-800 line-clamp-2 group-hover:text-[#1D9E75] transition-colors">
                  {surpriseBook.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{surpriseBook.author}</p>
                <p className="text-xs text-primary font-medium mt-2">Tap to see details →</p>
              </div>
            </button>
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
