"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  id: string;
  question: string;
  options: { label: string; emoji: string; value: string }[];
}

// ---------- Large question pool ----------
// We'll randomly select QUIZ_LENGTH questions from this pool each session.
const QUESTION_POOL: QuizStep[] = [
  // Mood
  {
    id: "mood",
    question: "What kind of mood are you in?",
    options: [
      { label: "I want an adventure", emoji: "🗺️", value: "adventure" },
      { label: "Make me think", emoji: "🧠", value: "think" },
      { label: "Warm my heart", emoji: "💛", value: "heart" },
      { label: "Keep me guessing", emoji: "🔍", value: "mystery" },
      { label: "Surprise me!", emoji: "🎲", value: "surprise" },
    ],
  },
  // Audience
  {
    id: "audience",
    question: "Who are you finding a book for?",
    options: [
      { label: "Me (Adult)", emoji: "🧑", value: "adult" },
      { label: "A teenager", emoji: "🎧", value: "teen" },
      { label: "A kid", emoji: "🧒", value: "kid" },
      { label: "Anyone!", emoji: "👨‍👩‍👧‍👦", value: "anyone" },
    ],
  },
  // Vibe
  {
    id: "vibe",
    question: "Pick a vibe:",
    options: [
      { label: "Based on a true story", emoji: "📰", value: "true" },
      { label: "Completely fictional", emoji: "🏰", value: "fiction" },
      { label: "Learn something new", emoji: "📚", value: "learn" },
      { label: "Don't care!", emoji: "🤷", value: "any" },
    ],
  },
  // Pace
  {
    id: "pace",
    question: "How fast do you like to read?",
    options: [
      { label: "Quick page-turner", emoji: "⚡", value: "fast" },
      { label: "Steady & immersive", emoji: "🌊", value: "medium" },
      { label: "I'll savor every page", emoji: "🍷", value: "slow" },
      { label: "Depends on my mood", emoji: "🎭", value: "any-pace" },
    ],
  },
  // Setting
  {
    id: "setting",
    question: "Where do you want to be transported?",
    options: [
      { label: "Another world entirely", emoji: "🌌", value: "fantasy-world" },
      { label: "A real city or town", emoji: "🏙️", value: "real-place" },
      { label: "Out in nature", emoji: "🏔️", value: "nature" },
      { label: "Inside someone's mind", emoji: "💭", value: "psychological" },
      { label: "Outer space", emoji: "🚀", value: "space" },
    ],
  },
  // Era
  {
    id: "era",
    question: "What time period interests you?",
    options: [
      { label: "The distant past", emoji: "🏛️", value: "historical" },
      { label: "The present day", emoji: "📱", value: "contemporary" },
      { label: "The future", emoji: "🤖", value: "future" },
      { label: "I'm flexible", emoji: "⏳", value: "any-era" },
    ],
  },
  // Tone
  {
    id: "tone",
    question: "What tone do you prefer?",
    options: [
      { label: "Dark & intense", emoji: "🌑", value: "dark" },
      { label: "Light & funny", emoji: "😂", value: "funny" },
      { label: "Emotional & deep", emoji: "🥺", value: "emotional" },
      { label: "Inspiring & uplifting", emoji: "🌅", value: "inspiring" },
      { label: "Eerie & unsettling", emoji: "👻", value: "eerie" },
    ],
  },
  // Length
  {
    id: "length",
    question: "How long of a book are you looking for?",
    options: [
      { label: "Short — under 250 pages", emoji: "📄", value: "short" },
      { label: "Medium — 250–400 pages", emoji: "📗", value: "medium-length" },
      { label: "Epic — 400+ pages", emoji: "📕", value: "long" },
      { label: "Length doesn't matter", emoji: "📏", value: "any-length" },
    ],
  },
  // Character
  {
    id: "character",
    question: "What kind of main character do you connect with?",
    options: [
      { label: "An underdog fighting back", emoji: "💪", value: "underdog" },
      { label: "A brilliant detective or genius", emoji: "🕵️", value: "genius" },
      { label: "A flawed but lovable person", emoji: "💔", value: "flawed" },
      { label: "An everyday person in extraordinary times", emoji: "🌟", value: "ordinary" },
      { label: "A rebel or outsider", emoji: "🔥", value: "rebel" },
    ],
  },
  // Last book energy
  {
    id: "last-book",
    question: "What did you love about the last book you read?",
    options: [
      { label: "The plot twists", emoji: "🌀", value: "twists" },
      { label: "The beautiful writing", emoji: "✍️", value: "prose" },
      { label: "The characters felt real", emoji: "🫂", value: "characters" },
      { label: "I learned something", emoji: "💡", value: "learning" },
      { label: "I couldn't put it down", emoji: "🔥", value: "unputdownable" },
    ],
  },
  // Reading context
  {
    id: "context",
    question: "Where will you be reading?",
    options: [
      { label: "On the couch at home", emoji: "🛋️", value: "home" },
      { label: "On a trip or commute", emoji: "✈️", value: "travel" },
      { label: "At the beach or pool", emoji: "🏖️", value: "beach" },
      { label: "Before bed", emoji: "🌙", value: "bedtime" },
    ],
  },
  // Social
  {
    id: "social",
    question: "Are you reading with others?",
    options: [
      { label: "Just me", emoji: "🧘", value: "solo" },
      { label: "For a book club", emoji: "📖", value: "book-club" },
      { label: "Reading together with my kid", emoji: "👨‍👧", value: "parent-child" },
      { label: "A gift for someone", emoji: "🎁", value: "gift" },
    ],
  },
];

const QUIZ_LENGTH = 5; // Number of questions to show per session

/** Shuffle array using Fisher-Yates */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Map quiz answers to genres to fetch from the API */
function answersToGenres(answerMap: Record<string, string>): Genre[] {
  const genres = new Set<Genre>();

  const mood = answerMap.mood;
  if (mood === "adventure") { genres.add("Sci-Fi"); genres.add("Fiction"); genres.add("Teens"); }
  if (mood === "think") { genres.add("Nonfiction"); genres.add("Biography"); }
  if (mood === "heart") { genres.add("Romance"); genres.add("Fiction"); }
  if (mood === "mystery") { genres.add("Mystery"); }

  const audience = answerMap.audience;
  if (audience === "teen") genres.add("Teens");
  if (audience === "kid") genres.add("Kids");

  const vibe = answerMap.vibe;
  if (vibe === "true") { genres.add("Biography"); genres.add("Nonfiction"); }
  if (vibe === "fiction") { genres.add("Fiction"); genres.add("Mystery"); genres.add("Romance"); genres.add("Sci-Fi"); }
  if (vibe === "learn") { genres.add("Nonfiction"); genres.add("Biography"); }

  const setting = answerMap.setting;
  if (setting === "fantasy-world") { genres.add("Sci-Fi"); genres.add("Fiction"); }
  if (setting === "space") genres.add("Sci-Fi");
  if (setting === "nature") { genres.add("Nonfiction"); genres.add("Fiction"); }
  if (setting === "psychological") genres.add("Mystery");

  const era = answerMap.era;
  if (era === "historical") { genres.add("Fiction"); genres.add("Biography"); }
  if (era === "future") genres.add("Sci-Fi");

  const tone = answerMap.tone;
  if (tone === "dark" || tone === "eerie") genres.add("Mystery");
  if (tone === "funny") { genres.add("Fiction"); genres.add("Kids"); }
  if (tone === "inspiring") { genres.add("Biography"); genres.add("Nonfiction"); }

  const social = answerMap.social;
  if (social === "parent-child") genres.add("Kids");
  if (social === "book-club") { genres.add("Fiction"); genres.add("Nonfiction"); }

  return genres.size > 0
    ? Array.from(genres)
    : ["Fiction", "Mystery", "Romance", "Sci-Fi", "Biography", "Kids", "Teens", "Nonfiction"];
}

function scoreBook(book: QuizBook, answerMap: Record<string, string>): number {
  let score = 0;
  const subjectsLower = book.subjects.map((s) => s.toLowerCase());
  const g = book.genre;

  // Mood
  const mood = answerMap.mood;
  if (mood === "adventure") {
    if (subjectsLower.some((s) => ["adventure", "fantasy", "dragons", "mythology", "survival", "quest", "epic"].some((k) => s.includes(k)))) score += 5;
    if (["Sci-Fi", "Fiction", "Teens"].includes(g)) score += 2;
  } else if (mood === "think") {
    if (subjectsLower.some((s) => ["psychology", "science", "education", "ecology", "neuroscience", "philosophy", "history"].some((k) => s.includes(k)))) score += 5;
    if (["Nonfiction", "Biography"].includes(g)) score += 3;
  } else if (mood === "heart") {
    if (subjectsLower.some((s) => ["romance", "friendship", "family", "love", "inspiration", "women", "relationship"].some((k) => s.includes(k)))) score += 5;
    if (["Romance", "Fiction"].includes(g)) score += 2;
  } else if (mood === "mystery") {
    if (subjectsLower.some((s) => ["mystery", "thriller", "suspense", "crime", "detective", "murder"].some((k) => s.includes(k)))) score += 5;
    if (g === "Mystery") score += 4;
  } else if (mood === "surprise") {
    score += Math.random() * 10;
  }

  // Audience
  const audience = answerMap.audience;
  if (audience === "adult" && ["Fiction", "Mystery", "Romance", "Sci-Fi", "Biography", "Nonfiction"].includes(g)) score += 3;
  if (audience === "teen" && g === "Teens") score += 5;
  if (audience === "kid" && g === "Kids") score += 5;

  // Vibe
  const vibe = answerMap.vibe;
  if (vibe === "true" && ["Biography", "Nonfiction"].includes(g)) score += 4;
  if (vibe === "fiction" && ["Fiction", "Mystery", "Romance", "Sci-Fi", "Kids", "Teens"].includes(g)) score += 3;
  if (vibe === "learn" && ["Nonfiction", "Biography"].includes(g)) score += 4;

  // Setting
  const setting = answerMap.setting;
  if (setting === "fantasy-world" && subjectsLower.some((s) => ["fantasy", "magic", "dragons", "mythology"].some((k) => s.includes(k)))) score += 4;
  if (setting === "space" && subjectsLower.some((s) => ["space", "alien", "sci-fi", "galaxy"].some((k) => s.includes(k)))) score += 4;
  if (setting === "nature" && subjectsLower.some((s) => ["nature", "ecology", "survival", "wilderness"].some((k) => s.includes(k)))) score += 4;
  if (setting === "psychological" && subjectsLower.some((s) => ["psychological", "suspense", "mental", "mind"].some((k) => s.includes(k)))) score += 4;

  // Tone
  const tone = answerMap.tone;
  if (tone === "dark" && subjectsLower.some((s) => ["thriller", "crime", "dark", "suspense"].some((k) => s.includes(k)))) score += 3;
  if (tone === "funny" && subjectsLower.some((s) => ["humor", "comedy", "funny", "satire"].some((k) => s.includes(k)))) score += 3;
  if (tone === "emotional" && subjectsLower.some((s) => ["family", "love", "loss", "coming of age"].some((k) => s.includes(k)))) score += 3;
  if (tone === "inspiring" && subjectsLower.some((s) => ["inspiration", "memoir", "resilience", "motivation"].some((k) => s.includes(k)))) score += 3;
  if (tone === "eerie" && subjectsLower.some((s) => ["horror", "gothic", "supernatural", "ghost"].some((k) => s.includes(k)))) score += 3;

  // Character
  const character = answerMap.character;
  if (character === "underdog" && subjectsLower.some((s) => ["survival", "rebellion", "coming of age"].some((k) => s.includes(k)))) score += 2;
  if (character === "genius" && (g === "Mystery" || subjectsLower.some((s) => s.includes("detective")))) score += 2;
  if (character === "rebel" && subjectsLower.some((s) => ["dystopia", "rebellion", "revolution"].some((k) => s.includes(k)))) score += 2;

  // Last book
  const lastBook = answerMap["last-book"];
  if (lastBook === "twists" && g === "Mystery") score += 3;
  if (lastBook === "prose" && ["Fiction", "Romance"].includes(g)) score += 2;
  if (lastBook === "learning" && ["Nonfiction", "Biography"].includes(g)) score += 3;
  if (lastBook === "unputdownable" && ["Mystery", "Teens"].includes(g)) score += 2;

  // Cover bonus
  if (book.coverUrl) score += 1;

  return score;
}

export default function BookQuiz({ onSelectBook }: { onSelectBook: (book: BookInfo) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answerMap, setAnswerMap] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState<QuizBook[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  // Preview books shown alongside each question
  const [previewBooks, setPreviewBooks] = useState<QuizBook[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Pick random questions for this session
  const quizSteps = useMemo(() => {
    // Always include mood + audience first, then pick random others
    const required = QUESTION_POOL.filter((q) => q.id === "mood" || q.id === "audience");
    const optional = shuffle(QUESTION_POOL.filter((q) => q.id !== "mood" && q.id !== "audience"));
    return [...required, ...optional].slice(0, QUIZ_LENGTH);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch preview books whenever answers change
  useEffect(() => {
    if (!isOpen || showResults || Object.keys(answerMap).length === 0) {
      setPreviewBooks([]);
      return;
    }

    let cancelled = false;
    setLoadingPreview(true);

    const genres = answersToGenres(answerMap);
    const fetchGenres = genres.slice(0, 3); // limit fetches

    Promise.all(
      fetchGenres.map((g) =>
        fetch(`/api/catalog/browse?genre=${g}&limit=15&random=true`)
          .then((r) => r.json())
          .then((d) => (d.books || []) as QuizBook[])
          .catch(() => [] as QuizBook[])
      )
    ).then((results) => {
      if (cancelled) return;
      const all = results.flat();
      const seen = new Set<number>();
      const unique = all.filter((b) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });
      const scored = unique
        .map((b) => ({ book: b, score: scoreBook(b, answerMap) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((r) => r.book);
      setPreviewBooks(scored);
      setLoadingPreview(false);
    });

    return () => { cancelled = true; };
  }, [isOpen, answerMap, showResults]);

  const fetchRecommendations = useCallback(async (finalAnswers: Record<string, string>) => {
    setLoadingResults(true);
    try {
      const genres = answersToGenres(finalAnswers);
      const fetches = genres.map((g) =>
        fetch(`/api/catalog/browse?genre=${g}&limit=30&offset=${Math.floor(Math.random() * 20)}`)
          .then((r) => r.json())
          .then((d) => (d.books || []) as QuizBook[])
          .catch(() => [] as QuizBook[])
      );
      const results = await Promise.all(fetches);
      const allBooks = results.flat();
      const seen = new Set<number>();
      const unique = allBooks.filter((b) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });
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

  const handleAnswer = (stepId: string, value: string) => {
    const newMap = { ...answerMap, [stepId]: value };
    setAnswerMap(newMap);
    if (step < quizSteps.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
      fetchRecommendations(newMap);
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
    setAnswerMap({});
    setShowResults(false);
    setRecommendations([]);
    setPreviewBooks([]);
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
            <p className="text-sm text-gray-500">Take our quick quiz and get personalized picks!</p>
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
            <div className="flex gap-1.5 mb-6">
              {quizSteps.map((_, i) => (
                <div key={i} className="h-1.5 flex-1 rounded-full overflow-hidden bg-purple-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      i < step ? "bg-purple-500 w-full"
                        : i === step ? "bg-purple-400 w-1/2"
                          : "w-0"
                    }`}
                    style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
                  />
                </div>
              ))}
            </div>

            {/* Step counter */}
            <p className="text-xs text-purple-400 font-medium mb-2">
              Question {step + 1} of {quizSteps.length}
            </p>

            {/* Question */}
            <p className="text-xl font-semibold text-gray-800 mb-5">
              {quizSteps[step].question}
            </p>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quizSteps[step].options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(quizSteps[step].id, opt.value)}
                  className="flex items-center gap-3 rounded-xl border-2 border-purple-100 bg-white px-4 py-3.5 text-left hover:border-purple-400 hover:bg-purple-50 hover:shadow-md transition-all group"
                >
                  <span className="text-2xl group-hover:scale-125 transition-transform">{opt.emoji}</span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">{opt.label}</span>
                </button>
              ))}
            </div>

            {step > 0 && (
              <button
                onClick={() => {
                  const prevId = quizSteps[step - 1].id;
                  const newMap = { ...answerMap };
                  delete newMap[prevId];
                  setAnswerMap(newMap);
                  setStep(step - 1);
                }}
                className="mt-4 text-sm text-purple-500 hover:underline"
              >
                ← Go back
              </button>
            )}

            {/* Preview books based on answers so far */}
            {Object.keys(answerMap).length > 0 && (
              <div className="mt-6 pt-5 border-t border-purple-100">
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">
                  Books shaping up for you...
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {loadingPreview ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-20">
                        <div className="aspect-[2/3] w-20 rounded-lg bg-purple-100 animate-pulse" />
                      </div>
                    ))
                  ) : previewBooks.length > 0 ? (
                    previewBooks.map((book) => (
                      <button
                        key={book.id}
                        onClick={() => handleSelectBook(book)}
                        className="flex-shrink-0 group focus:outline-none"
                      >
                        <div className="relative aspect-[2/3] w-20 rounded-lg overflow-hidden border border-purple-100 shadow-sm group-hover:shadow-md group-hover:border-purple-300 transition-all">
                          {book.coverUrl ? (
                            <Image
                              src={book.coverUrl}
                              alt={book.title}
                              fill
                              sizes="80px"
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-1">
                              <span className="text-[8px] font-semibold text-purple-600 text-center line-clamp-3">{book.title}</span>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 w-20 text-[10px] text-gray-500 line-clamp-1 text-center">{book.title}</p>
                      </button>
                    ))
                  ) : null}
                </div>
              </div>
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
