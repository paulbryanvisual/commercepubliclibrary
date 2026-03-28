"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import {
  books,
  genres,
  getRelatedBooks,
  type Book,
  type Genre,
} from "@/lib/catalog/books";
import BookDetailPanel, { type BookInfo } from "@/components/catalog/BookDetailPanel";

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

// ---------- Helper: convert Book → BookInfo ----------
function toBookInfo(book: Book): BookInfo {
  return {
    title: book.title,
    author: book.author,
    year: book.year,
    isbn: book.isbn,
    coverUrl: book.coverUrl,
    subjects: book.subjects,
    description: book.description,
    genre: book.genre,
  };
}

// ---------- Main CatalogBrowser ----------
export default function CatalogBrowser({ initialGenre }: { initialGenre?: Genre } = {}) {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(initialGenre || null);
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

  // Get related books for the selected book
  const related = selectedBook ? getRelatedBooks(selectedBook).map(toBookInfo) : [];

  return (
    <section>
      {!initialGenre && <GenreFilter selected={selectedGenre} onSelect={setSelectedGenre} />}

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
          book={toBookInfo(selectedBook)}
          onClose={handleClose}
          onSelectRelated={(b) => {
            // Find the matching Book object from our catalog
            const match = books.find(
              (bk) => bk.title === b.title || bk.isbn === b.isbn
            );
            if (match) handleSelectBook(match);
          }}
          relatedBooks={related}
        />
      )}
    </section>
  );
}
