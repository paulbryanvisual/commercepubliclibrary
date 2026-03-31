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

const MATERIAL_FILTERS = [
  { label: "All Media", value: null },
  { label: "DVDs", value: "DVD" },
  { label: "Large Print", value: "Large Print" },
  { label: "Audiobooks", value: "Audio Book" },
  { label: "Book & CD", value: "Book & CD" },
];

export default function DVDsPage() {
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<BookInfo | null>(null);
  const [materialFilter, setMaterialFilter] = useState<string | null>(null);

  useEffect(() => {
    // Fetch DVDs and other media types
    setLoading(true);
    const fetchMedia = async () => {
      try {
        // Fetch DVD genre (has material_type=DVD from import)
        const dvdRes = await fetch("/api/catalog/browse?genre=DVD&limit=200&offset=0");
        const dvdData = await dvdRes.json();

        // Also fetch all genres to find Large Print, Audiobook items
        const allRes = await fetch("/api/catalog/browse?genre=all&limit=200&offset=0");
        const allData = await allRes.json();

        const allBooks: CatalogBook[] = [...(dvdData.books || []), ...(allData.books || [])];

        // Deduplicate and filter to non-standard material types
        const seen = new Set<number>();
        const media = allBooks.filter((b) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return (
            b.materialType === "DVD" ||
            b.materialType === "Large Print" ||
            b.materialType === "Audio Book" ||
            b.materialType === "Book & CD"
          );
        });

        setBooks(media);
      } catch {
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, []);

  const filtered = materialFilter
    ? books.filter((b) => b.materialType === materialFilter)
    : books;

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

  // Count by type
  const typeCounts: Record<string, number> = {};
  for (const b of books) {
    const t = b.materialType || "Other";
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          DVDs & Media
        </h1>
        <p className="text-lg text-gray-500">
          Movies, large print books, audiobooks, and other physical media in our collection.
        </p>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {MATERIAL_FILTERS.map((mf) => (
          <button
            key={mf.label}
            onClick={() => setMaterialFilter(mf.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              materialFilter === mf.value
                ? "bg-[#1D9E75] text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-500 hover:border-[#1D9E75] hover:text-[#1D9E75]"
            }`}
          >
            {mf.label}
            {mf.value && typeCounts[mf.value] ? ` (${typeCounts[mf.value]})` : ""}
            {!mf.value ? ` (${books.length})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
          {filtered.map((book) => (
            <MediaCard key={book.id} book={book} onClick={handleSelect} />
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No items found for this media type.</p>
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

function MediaCard({
  book,
  onClick,
}: {
  book: CatalogBook;
  onClick: (book: CatalogBook) => void;
}) {
  const [imgError, setImgError] = useState(false);

  const typeColors: Record<string, string> = {
    DVD: "bg-red-500",
    "Large Print": "bg-blue-500",
    "Audio Book": "bg-amber-500",
    "Book & CD": "bg-purple-500",
  };

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
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-gray-200 p-4 text-center">
            <span className="text-sm font-semibold text-gray-700 leading-tight line-clamp-3">
              {book.title}
            </span>
            <span className="mt-1 text-xs text-gray-500">{book.author}</span>
          </div>
        )}

        {/* Material type badge */}
        <div className={`absolute top-2 left-2 rounded-full ${typeColors[book.materialType || ""] || "bg-gray-500"} px-2 py-0.5 text-[10px] font-bold text-white shadow`}>
          {book.materialType}
        </div>

        {/* Availability indicator */}
        {book.available != null && (
          <div className="absolute top-2 right-2">
            <div className={`h-2.5 w-2.5 rounded-full ${book.available > 0 ? "bg-green-400" : "bg-red-400"} ring-2 ring-white shadow`} />
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
