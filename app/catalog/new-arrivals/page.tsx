"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import BookDetailPanel, { type BookInfo } from "@/components/catalog/BookDetailPanel";

interface CatalogBook {
  id: number;
  isbn: string | null;
  title: string;
  author: string | null;
  year: number | null;
  genre: string;
  description: string | null;
  subjects: string[];
  coverUrl: string | null;
  available: number | null;
  totalCopies: number | null;
  materialType: string | null;
  callNumber: string | null;
  openLibraryKey: string | null;
}

const YEAR_FILTERS = [
  { label: "2025", value: 2025 },
  { label: "2024", value: 2024 },
  { label: "2023", value: 2023 },
  { label: "2022", value: 2022 },
];

export default function NewArrivalsPage() {
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/catalog/browse?genre=all&limit=100&offset=0`)
      .then((r) => r.json())
      .then((data) => setBooks(data.books || []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredBooks = yearFilter
    ? books.filter((b) => b.year === yearFilter)
    : books.filter((b) => b.year && b.year >= 2022);

  // Sort by year descending
  const sorted = [...filteredBooks].sort((a, b) => (b.year || 0) - (a.year || 0));

  const handleSelect = useCallback((book: CatalogBook) => {
    setSelectedBook({
      id: book.id,
      title: book.title,
      author: book.author || undefined,
      year: book.year,
      isbn: book.isbn,
      coverUrl: book.coverUrl,
      subjects: book.subjects,
      description: book.description || undefined,
      genre: book.genre,
      openLibraryKey: book.openLibraryKey || undefined,
      available: book.available,
      totalCopies: book.totalCopies,
      materialType: book.materialType,
      callNumber: book.callNumber,
    });
  }, []);

  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          New Arrivals
        </h1>
        <p className="text-lg text-gray-500">
          The latest additions to our collection. Fresh off the shelves!
        </p>
      </div>

      {/* Year filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setYearFilter(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            yearFilter === null
              ? "bg-[#1D9E75] text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-500 hover:border-[#1D9E75] hover:text-[#1D9E75]"
          }`}
        >
          All Recent
        </button>
        {YEAR_FILTERS.map((yf) => (
          <button
            key={yf.value}
            onClick={() => setYearFilter(yf.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              yearFilter === yf.value
                ? "bg-[#1D9E75] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-500 hover:border-[#1D9E75] hover:text-[#1D9E75]"
            }`}
          >
            {yf.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="flex gap-6 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
          <p className="text-2xl font-bold text-[#1D9E75]">{sorted.length}</p>
          <p className="text-xs text-gray-500">books found</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
          {sorted.map((book) => (
            <NewArrivalCard key={book.id} book={book} onClick={handleSelect} />
          ))}
        </div>
      )}

      {sorted.length === 0 && !loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No books found for this period.</p>
        </div>
      )}

      {selectedBook && (
        <BookDetailPanel
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )}
    </div>
  );
}

function NewArrivalCard({
  book,
  onClick,
}: {
  book: CatalogBook;
  onClick: (book: CatalogBook) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onClick(book)}
      className="group relative flex flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1D9E75] focus-visible:ring-offset-2 rounded-xl"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
        {book.coverUrl && !imgError ? (
          <Image
            src={book.coverUrl}
            alt={`Cover of ${book.title}`}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4 text-center">
            <span className="text-sm font-semibold text-gray-700 leading-tight line-clamp-3">
              {book.title}
            </span>
            <span className="mt-1 text-xs text-gray-500">{book.author}</span>
          </div>
        )}

        {/* Year badge */}
        {book.year && book.year >= 2024 && (
          <div className="absolute top-2 left-2 rounded-full bg-[#1D9E75] px-2 py-0.5 text-[10px] font-bold text-white shadow">
            {book.year}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 rounded-xl p-4">
          <span className="text-base font-semibold text-white leading-tight line-clamp-2">
            {book.title}
          </span>
          <span className="mt-1 text-sm text-white/80">{book.author}</span>
        </div>
      </div>

      <div className="mt-2.5">
        <p className="text-sm font-medium text-gray-700 line-clamp-1">{book.title}</p>
        <p className="text-xs text-gray-400 line-clamp-1">{book.author}</p>
      </div>
    </button>
  );
}
