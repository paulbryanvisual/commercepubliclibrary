"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { type Genre } from "@/lib/catalog/books";
import BookDetailPanel, { type BookInfo } from "@/components/catalog/BookDetailPanel";

const GENRES: Genre[] = ["Fiction", "Mystery", "Sci-Fi", "Biography", "Kids", "Teens", "Nonfiction"];

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
  publisher: string | null;
  pages: number | null;
  openLibraryKey: string | null;
}

// ---------- Genre Filter Pills ----------
function GenreFilter({
  selected,
  onSelect,
  counts,
}: {
  selected: string | null;
  onSelect: (g: Genre | null) => void;
  counts?: Record<string, number>;
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
        All{counts ? ` (${Object.values(counts).reduce((a, b) => a + b, 0)})` : ""}
      </button>
      {GENRES.map((g) => (
        <button
          key={g}
          onClick={() => onSelect(g)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selected === g
              ? "bg-primary text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-500 hover:border-primary-border hover:text-primary"
          }`}
        >
          {g}{counts && counts[g] ? ` (${counts[g]})` : ""}
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
  book: CatalogBook;
  onClick: (book: CatalogBook) => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onClick(book)}
      className="group relative flex flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
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
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-primary-light to-primary-border p-4 text-center">
            <span className="text-base font-semibold text-primary-dark leading-tight line-clamp-3">
              {book.title}
            </span>
            <span className="mt-1.5 text-sm text-primary-mid">{book.author}</span>
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

function toBookInfo(book: CatalogBook): BookInfo {
  return {
    title: book.title,
    author: book.author || undefined,
    year: book.year,
    isbn: book.isbn,
    coverUrl: book.coverUrl,
    subjects: book.subjects,
    description: book.description || undefined,
    genre: book.genre,
    openLibraryKey: book.openLibraryKey || undefined,
  };
}

// ---------- Main CatalogBrowser ----------
export default function CatalogBrowser({ initialGenre }: { initialGenre?: Genre } = {}) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(initialGenre || null);
  const [selectedBook, setSelectedBook] = useState<CatalogBook | null>(null);
  const [books, setBooks] = useState<CatalogBook[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [genreCounts, setGenreCounts] = useState<Record<string, number>>({});
  const offsetRef = useRef(0);
  const PAGE_SIZE = 48;

  // Fetch genre counts
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/catalog/genres");
        if (res.ok) {
          const data = await res.json();
          const counts: Record<string, number> = {};
          for (const g of data.genres || []) counts[g.name] = g.count;
          setGenreCounts(counts);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // Fetch books when genre changes
  useEffect(() => {
    setLoading(true);
    offsetRef.current = 0;

    const genre = selectedGenre || "all";
    fetch(`/api/catalog/browse?genre=${genre}&limit=${PAGE_SIZE}&offset=0`)
      .then((r) => r.json())
      .then((data) => {
        setBooks(data.books || []);
        setTotal(data.total || 0);
        offsetRef.current = data.books?.length || 0;
      })
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, [selectedGenre]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const genre = selectedGenre || "all";
    try {
      const res = await fetch(`/api/catalog/browse?genre=${genre}&limit=${PAGE_SIZE}&offset=${offsetRef.current}`);
      const data = await res.json();
      const newBooks: CatalogBook[] = data.books || [];
      setBooks((prev) => [...prev, ...newBooks]);
      offsetRef.current += newBooks.length;
    } catch { /* ignore */ }
    setLoadingMore(false);
  }, [selectedGenre, loadingMore]);

  const handleSelectBook = useCallback((book: CatalogBook) => {
    setSelectedBook(book);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedBook(null);
  }, []);

  const hasMore = books.length < total;

  return (
    <section>
      {!initialGenre && (
        <GenreFilter
          selected={selectedGenre}
          onSelect={(g) => setSelectedGenre(g)}
          counts={genreCounts}
        />
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Book grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 md:gap-6">
            {books.map((book) => (
              <BookCard key={book.id} book={book} onClick={handleSelectBook} />
            ))}
          </div>

          {books.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center mt-4">
              <p className="text-gray-500">No books found in this category.</p>
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-xl border border-gray-200 bg-white px-8 py-3 text-sm font-medium text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <span className="animate-spin h-4 w-4 rounded-full border-2 border-gray-300 border-t-[#1D9E75]" />
                    Loading...
                  </>
                ) : (
                  <>
                    Show More Books
                    <span className="text-xs text-gray-400">
                      ({books.length} of {total.toLocaleString()})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail panel */}
      {selectedBook && (
        <BookDetailPanel
          book={toBookInfo(selectedBook)}
          onClose={handleClose}
        />
      )}
    </section>
  );
}
