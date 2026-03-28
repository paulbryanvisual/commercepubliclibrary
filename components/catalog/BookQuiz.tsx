"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { books, type Book, type Genre } from "@/lib/catalog/books";

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

function scoreBook(book: Book, answers: string[]): number {
  let score = 0;
  const [mood, audience, vibe] = answers;

  // Mood matching
  if (mood === "adventure") {
    if (book.subjects.some((s) => ["adventure", "fantasy", "dragons", "mythology", "survival"].includes(s.toLowerCase()))) score += 5;
    if (["Sci-Fi", "Fiction", "Teens"].includes(book.genre)) score += 2;
  } else if (mood === "think") {
    if (book.subjects.some((s) => ["psychology", "science", "education", "ecology", "neuroscience"].includes(s.toLowerCase()))) score += 5;
    if (["Nonfiction", "Biography"].includes(book.genre)) score += 3;
  } else if (mood === "heart") {
    if (book.subjects.some((s) => ["romance", "friendship", "family", "love", "inspiration", "women"].includes(s.toLowerCase()))) score += 5;
    if (["Romance", "Fiction"].includes(book.genre)) score += 2;
  } else if (mood === "mystery") {
    if (book.subjects.some((s) => ["mystery", "thriller", "suspense", "crime", "detective"].includes(s.toLowerCase()))) score += 5;
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
  if (vibe === "true" && book.subjects.some((s) => ["memoir", "history", "WWII", "Holocaust"].includes(s.toLowerCase()))) score += 3;
  if (vibe === "fiction" && ["Fiction", "Mystery", "Romance", "Sci-Fi", "Kids", "Teens"].includes(book.genre)) score += 3;
  if (vibe === "learn" && ["Nonfiction", "Biography"].includes(book.genre)) score += 4;
  if (vibe === "any") score += 1;

  return score;
}

export default function BookQuiz({ onSelectBook }: { onSelectBook: (book: Book) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const recommendations = useMemo(() => {
    if (!showResults || answers.length < 3) return [];
    return books
      .map((b) => ({ book: b, score: scoreBook(b, answers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((r) => r.book);
  }, [showResults, answers]);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    if (step < quizSteps.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setShowResults(false);
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
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2">
              {recommendations.map((book) => (
                <QuizResultCard key={book.isbn} book={book} onClick={onSelectBook} />
              ))}
            </div>
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

function QuizResultCard({ book, onClick }: { book: Book; onClick: (book: Book) => void }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <button
      onClick={() => onClick(book)}
      className="flex-shrink-0 w-36 group text-left focus:outline-none"
    >
      <div className="relative aspect-[2/3] w-36 rounded-xl overflow-hidden border-2 border-purple-100 shadow-md group-hover:shadow-xl group-hover:border-purple-300 transition-all">
        {!imgErr ? (
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
