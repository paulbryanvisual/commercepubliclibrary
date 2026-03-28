"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { type Genre } from "@/lib/catalog/books";

/** Lightweight book shape for quiz results (fetched from API) */
interface QuizBook {
  id: number;
  title: string;
  author: string | null;
  year: number | null;
  genre: string;
  description: string | null;
  subjects: string[];
  coverUrl: string | null;
  isbn: string | null;
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

interface QuizStep {
  question: string;
  options: { label: string; emoji: string; value: string }[];
}

const quizSteps: QuizStep[] = [
  {
    question: "What kind of mood are you in?",
    options: [
      { label: "I want an adventure", emoji: "🗺️", value: "adventure" },
      { label: "Make me think", emoji: "🧠", value: "think" },
      { label: "Warm my heart", emoji: "💛", value: "heart" },
      { label: "Keep me guessing", emoji: "🔍", value: "mystery" },
      { label: "Surprise me!", emoji: "🎲", value: "surprise" },
    ],
  },
  {
    question: "Who are you finding a book for?",
    options: [
      { label: "Me (Adult)", emoji: "🧑", value: "adult" },
      { label: "A teenager", emoji: "🎧", value: "teen" },
      { label: "A kid", emoji: "🧒", value: "kid" },
      { label: "Anyone!", emoji: "👨‍👩‍👧‍👦", value: "anyone" },
    ],
  },
  {
    question: "Pick a vibe:",
    options: [
      { label: "Based on a true story", emoji: "📰", value: "true" },
      { label: "Completely fictional", emoji: "🏰", value: "fiction" },
      { label: "Learn something new", emoji: "📚", value: "learn" },
      { label: "Don't care!", emoji: "🤷", value: "any" },
    ],
  },
];

/** Map quiz answers to genres to fetch from the API */
function answersToGenres(answers: string[]): Genre[] {
  const [mood, audience, vibe] = answers;
  const genres = new Set<Genre>();

  // Mood -> genres
  if (mood === "adventure") { genres.add("Sci-Fi"); genres.add("Fiction"); genres.add("Teens"); }
  if (mood === "think") { genres.add("Nonfiction"); genres.add("Biography"); }
  if (mood === "heart") { genres.add("Romance"); genres.add("Fiction"); }
  if (mood === "mystery") { genres.add("Mystery"); }
  if (mood === "surprise") { /* all genres */ }

  // Audience -> genres
  if (audience === "teen") genres.add("Teens");
  if (audience === "kid") genres.add("Kids");

  // Vibe -> genres
  if (vibe === "true") { genres.add("Biography"); genres.add("Nonfiction"); }
  if (vibe === "fiction") { genres.add("Fiction"); genres.add("Mystery"); genres.add("Romance"); genres.add("Sci-Fi"); }
  if (vibe === "learn") { genres.add("Nonfiction"); genres.add("Biography"); }

  return genres.size > 0 ? Array.from(genres) : ["Fiction", "Mystery", "Romance", "Sci-Fi", "Biography", "Kids", "Teens", "Nonfiction"];
}

function scoreBook(book: QuizBook, answers: string[]): number {
  let score = 0;
  const [mood, audience, vibe] = answers;
  const subjectsLower = book.subjects.map((s) => s.toLowerCase());

  // Mood matching
  if (mood === "adventure") {
    if (subjectsLower.some((s) => ["adventure", "fantasy", "dragons", "mythology", "survival", "quest", "epic"].some((k) => s.includes(k)))) score += 5;
    if (["Sci-Fi", "Fiction", "Teens"].includes(book.genre)) score += 2;
  } else if (mood === "think") {
    if (subjectsLower.some((s) => ["psychology", "science", "education", "ecology", "neuroscience", "philosophy", "history"].some((k) => s.includes(k)))) score += 5;
    if (["Nonfiction", "Biography"].includes(book.genre)) score += 3;
  } else if (mood === "heart") {
    if (subjectsLower.some((s) => ["romance", "friendship", "family", "love", "inspiration", "women", "relationship"].some((k) => s.includes(k)))) score += 5;
    if (["Romance", "Fiction"].includes(book.genre)) score += 2;
  } else if (mood === "mystery") {
    if (subjectsLower.some((s) => ["mystery", "thriller", "suspense", "crime", "detective", "murder"].some((k) => s.includes(k)))) score += 5;
    if (book.genre === "Mystery") score += 4;
  } else if (mood === "surprise") {
    score += Math.random() * 10;
  }

  // Audience matching
  if (audience === "adult" && ["Fiction", "Mystery", "Romance", "Sci-Fi", "Biography", "Nonfiction"].includes(book.genre)) score += 3;
  if (audience === "teen" && book.genre === "Teens") score += 5;
  if (audience === "kid" && book.genre === "Kids") score += 5;
  if (audience === "anyone") score += 1;

  // Vibe matching
  if (vibe === "true" && ["Biography", "Nonfiction"].includes(book.genre)) score += 4;
  if (vibe === "true" && subjectsLower.some((s) => ["memoir", "history", "true crime", "autobiography"].some((k) => s.includes(k)))) score += 3;
  if (vibe === "fiction" && ["Fiction", "Mystery", "Romance", "Sci-Fi", "Kids", "Teens"].includes(book.genre)) score += 3;
  if (vibe === "learn" && ["Nonfiction", "Biography"].includes(book.genre)) score += 4;
  if (vibe === "any") score += 1;

  // Bonus for having a cover image (better UX)
  if (book.coverUrl) score += 1;

  return score;
}

export default function BookQuiz({ onSelectBook }: { onSelectBook: (book: BookInfo) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState<QuizBook[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const fetchRecommendations = useCallback(async (finalAnswers: string[]) => {
    setLoadingResults(true);
    try {
      const genres = answersToGenres(finalAnswers);
      // Fetch books from multiple relevant genres
      const fetches = genres.map((g) =>
        fetch(`/api/catalog/browse?genre=${g}&limit=30&offset=${Math.floor(Math.random() * 20)}`)
          .then((r) => r.json())
          .then((d) => (d.books || []) as QuizBook[])
          .catch(() => [] as QuizBook[])
      );
      const results = await Promise.all(fetches);
      const allBooks = results.flat();

      // Deduplicate by id
      const seen = new Set<number>();
      const unique = allBooks.filter((b) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });

      // Score and pick top 5
      const scored = unique
        .map((b) => ({ book: b, score: scoreBook(b, finalAnswers) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((r) => r.book);

      setRecommendations(scored);
    } catch {
      setRecommendations([]);
    }
    setLoadingResults(false);
  }, []);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    if (step < quizSteps.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
      fetchRecommendations(newAnswers);
    }
  };

  const handleSelectBook = useCallback((book: QuizBook) => {
    onSelectBook({
      title: book.title,
      author: book.author || undefined,
      year: book.year,
      isbn: book.isbn,
      coverUrl: book.coverUrl,
      subjects: book.subjects,
      description: book.description || undefined,
      genre: book.genre,
      openLibraryKey: book.openLibraryKey || undefined,
    });
  }, [onSelectBook]);

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setShowResults(false);
    setRecommendations([]);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-[2px] hover:shadow-xl hover:shadow-purple-500/20 transition-all group"
      >
        <div className="rounded-[14px] bg-white px-6 py-5 flex items-center gap-4 group-hover:bg-gradient-to-r group-hover:from-purple-50 group-hover:to-orange-50 transition-colors">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <span className="text-2xl">✨</span>
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-gray-800 text-base">Not sure what to read next?</p>
            <p className="text-sm text-gray-500">Take our 30-second quiz and get personalized picks!</p>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2" className="shrink-0">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 md:p-8 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-100 opacity-50" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-pink-100 opacity-50" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <h3 className="text-lg font-bold text-gray-800">
              {showResults ? "Your Perfect Reads!" : "Find Your Next Book"}
            </h3>
          </div>
          <button
            onClick={() => { setIsOpen(false); reset(); }}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showResults ? (
          <>
            {/* Progress */}
            <div className="flex gap-2 mb-6">
              {quizSteps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= step ? "bg-purple-500" : "bg-purple-200"
                  }`}
                />
              ))}
            </div>

            {/* Question */}
            <p className="text-xl font-semibold text-gray-800 mb-5">
              {quizSteps[step].question}
            </p>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quizSteps[step].options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className="flex items-center gap-3 rounded-xl border-2 border-purple-100 bg-white px-4 py-3.5 text-left hover:border-purple-400 hover:bg-purple-50 hover:shadow-md transition-all group"
                >
                  <span className="text-2xl group-hover:scale-125 transition-transform">{opt.emoji}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">{opt.label}</span>
                </button>
              ))}
            </div>

            {step > 0 && (
              <button
                onClick={() => { setStep(step - 1); setAnswers(answers.slice(0, -1)); }}
                className="mt-4 text-sm text-purple-500 hover:underline"
              >
                ← Go back
              </button>
            )}
          </>
        ) : (
          <>
            {/* Results */}
            <p className="text-sm text-gray-500 mb-5">
              Based on your answers, we think you&apos;ll love these:
            </p>

            {loadingResults ? (
              <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-36">
                    <div className="aspect-[2/3] w-36 rounded-xl bg-purple-100 animate-pulse" />
                    <div className="mt-2 h-3 bg-purple-100 rounded animate-pulse w-3/4" />
                    <div className="mt-1 h-2 bg-purple-50 rounded animate-pulse w-1/2" />
                  </div>
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2">
                {recommendations.map((book) => (
                  <QuizResultCard key={book.id} book={book} onClick={handleSelectBook} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No recommendations found. Try again with different answers!</p>
              </div>
            )}

            <div className="flex items-center gap-4 mt-5 pt-4 border-t border-purple-100">
              <button
                onClick={reset}
                className="rounded-xl border border-purple-200 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => { setIsOpen(false); reset(); }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuizResultCard({ book, onClick }: { book: QuizBook; onClick: (book: QuizBook) => void }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <button
      onClick={() => onClick(book)}
      className="flex-shrink-0 w-36 group text-left focus:outline-none"
    >
      <div className="relative aspect-[2/3] w-36 rounded-xl overflow-hidden border-2 border-purple-100 shadow-md group-hover:shadow-xl group-hover:border-purple-300 transition-all">
        {book.coverUrl && !imgErr ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="144px"
            className="object-cover group-hover:scale-105 transition-transform"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 p-3 text-center">
            <span className="text-xs font-semibold text-purple-700">{book.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
          <span className="text-[10px] text-white font-medium">View details →</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold text-gray-700 line-clamp-2 leading-tight">{book.title}</p>
      <p className="text-[11px] text-gray-400 line-clamp-1">{book.author}</p>
    </button>
  );
}
