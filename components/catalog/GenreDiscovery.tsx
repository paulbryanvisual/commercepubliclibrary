"use client";

import { useState } from "react";
import Image from "next/image";
import { books, type Book, type Genre } from "@/lib/catalog/books";

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
  onSelectBook: (book: Book) => void;
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

function SurpriseSection({ onSelectBook }: { onSelectBook: (book: Book) => void }) {
  const [surpriseBook, setSurpriseBook] = useState<Book | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleSurprise = () => {
    setIsSpinning(true);
    // Animate through a few books quickly then land on one
    let count = 0;
    const interval = setInterval(() => {
      const randomBook = books[Math.floor(Math.random() * books.length)];
      setSurpriseBook(randomBook);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 120);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-amber-50 via-white to-rose-50 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Left - CTA */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center">
              <span className="text-xl">🎲</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Feeling Adventurous?</h3>
              <p className="text-xs text-gray-500">Let fate choose your next read</p>
            </div>
          </div>
          <button
            onClick={handleSurprise}
            disabled={isSpinning}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {isSpinning ? (
              <>
                <span className="animate-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                Picking...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                Surprise Me!
              </>
            )}
          </button>
        </div>

        {/* Right - Result */}
        {surpriseBook && (
          <button
            onClick={() => onSelectBook(surpriseBook)}
            className="flex items-center gap-4 rounded-xl bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group max-w-sm"
          >
            <div className="relative aspect-[2/3] w-16 shrink-0 rounded-lg overflow-hidden">
              <Image
                src={surpriseBook.coverUrl}
                alt={surpriseBook.title}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs text-amber-600 font-semibold mb-0.5">Your surprise pick:</p>
              <p className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-[#1D9E75] transition-colors">
                {surpriseBook.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{surpriseBook.author}</p>
              <p className="text-[10px] text-gray-400 mt-1">Tap to see details →</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
