"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import {
  books,
  genres,
  getRelatedBooks,
  type Book,
  type Genre,
} from "@/lib/catalog/books";

// ---------- Genre Filter Pills ----------
function GenreFilter({
  selected,
  onSelect,
}: {
  selected: Genre | null;
  onSelect: (g: Genre | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          selected === null
            ? "bg-primary text-white shadow-sm"
            : "bg-white border border-gray-200 text-gray-500 hover:border-primary-border hover:text-primary"
        }`}
      >
        All
      </button>
      {genres.map((g) => (
        <button
          key={g}
          onClick={() => onSelect(g)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selected === g
              ? "bg-primary text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-500 hover:border-primary-border hover:text-primary"
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  );
}

// ---------- Book Cover Card ----------
function BookCard({
  book,
  onClick,
}: {
  book: Book;
  onClick: (book: Book) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onClick(book)}
      className="group relative flex flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
    >
      {/* Cover image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
        {!imgError ? (
          <Image
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary-light to-primary-border p-3 text-center">
            <span className="text-sm font-semibold text-primary-dark leading-tight">
              {book.title}
            </span>
            <span className="mt-1 text-xs text-primary-mid">{book.author}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-xl p-3">
          <span className="text-sm font-semibold text-white leading-tight line-clamp-2">
            {book.title}
          </span>
          <span className="mt-0.5 text-xs text-white/80">{book.author}</span>
        </div>
      </div>

      {/* Title below on mobile */}
      <div className="mt-2 sm:hidden">
        <p className="text-xs font-medium text-gray-700 line-clamp-1">{book.title}</p>
        <p className="text-[11px] text-gray-400 line-clamp-1">{book.author}</p>
      </div>
    </button>
  );
}

// ---------- Related Book Thumbnail ----------
function RelatedThumb({
  book,
  onClick,
}: {
  book: Book;
  onClick: (book: Book) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onClick(book)}
      className="group flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
    >
      <div className="relative aspect-[2/3] w-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm transition-shadow group-hover:shadow-md">
        {!imgError ? (
          <Image
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            fill
            sizes="80px"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-light to-primary-border p-1.5 text-center">
            <span className="text-[10px] font-medium text-primary-dark leading-tight line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
      </div>
      <p className="mt-1 w-20 text-[11px] text-gray-500 line-clamp-1 text-center">
        {book.title}
      </p>
    </button>
  );
}

// ---------- Book Detail Panel (slide-over) ----------
function BookDetailPanel({
  book,
  onClose,
  onSelectBook,
}: {
  book: Book;
  onClose: () => void;
  onSelectBook: (book: Book) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const related = getRelatedBooks(book);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Trap focus to panel
  useEffect(() => {
    panelRef.current?.focus();
  }, [book]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label={`Details for ${book.title}`}
        className="relative z-10 w-full max-w-lg bg-white shadow-2xl overflow-y-auto animate-slide-in-right"
        style={{
          animation: "slideInRight 0.3s ease-out forwards",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="sticky top-0 right-0 z-20 float-right m-4 rounded-full bg-white/90 p-2 shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-600"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-4">
          {/* Cover */}
          <div className="flex justify-center mb-6">
            <div className="relative aspect-[2/3] w-48 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-lg">
              {!imgError ? (
                <Image
                  src={book.coverUrl}
                  alt={`Cover of ${book.title}`}
                  fill
                  sizes="192px"
                  className="object-cover"
                  priority
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary-light to-primary-border p-4 text-center">
                  <span className="text-base font-semibold text-primary-dark">
                    {book.title}
                  </span>
                  <span className="mt-1 text-sm text-primary-mid">
                    {book.author}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Title & meta */}
          <h2 className="text-h2 text-gray-800 text-center">{book.title}</h2>
          <p className="text-center text-gray-500 mt-1">
            {book.author} &middot; {book.year}
          </p>

          {/* Genre badge */}
          <div className="flex justify-center mt-3">
            <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark">
              {book.genre}
            </span>
          </div>

          {/* Description */}
          <p className="mt-6 text-body text-gray-600 leading-relaxed">
            {book.description}
          </p>

          {/* Subject tags */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            {book.subjects.map((s) => (
              <span
                key={s}
                className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] text-gray-500"
              >
                {s}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6">
            <button className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white hover:bg-primary-mid transition-colors">
              Place Hold
            </button>
            <button className="flex-1 rounded-xl border border-blue-200 bg-blue-light py-3 text-sm font-medium text-blue hover:bg-blue-100 transition-colors">
              Borrow on Libby
            </button>
          </div>

          {/* Related books */}
          {related.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-h3 text-gray-800 mb-4">You Might Also Like</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {related.map((rb) => (
                  <RelatedThumb
                    key={rb.isbn}
                    book={rb}
                    onClick={onSelectBook}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-in animation */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

// ---------- Main CatalogBrowser ----------
export default function CatalogBrowser() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const filteredBooks = selectedGenre
    ? books.filter((b) => b.genre === selectedGenre)
    : books;

  const handleSelectBook = useCallback((book: Book) => {
    setSelectedBook(book);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedBook(null);
  }, []);

  return (
    <section>
      <GenreFilter selected={selectedGenre} onSelect={setSelectedGenre} />

      {/* Book grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 md:gap-5">
        {filteredBooks.map((book) => (
          <BookCard key={book.isbn} book={book} onClick={handleSelectBook} />
        ))}
      </div>

      {filteredBooks.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center mt-4">
          <p className="text-gray-500">No books found in this category.</p>
        </div>
      )}

      {/* Detail panel */}
      {selectedBook && (
        <BookDetailPanel
          book={selectedBook}
          onClose={handleClose}
          onSelectBook={handleSelectBook}
        />
      )}
    </section>
  );
}
