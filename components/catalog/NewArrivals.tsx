"use client";

import { useRef, useState, useEffect } from "react";

interface NewArrival {
  itemId: string;
  coverUrl: string;
  opacUrl: string;
  title: string;
}

export default function NewArrivals() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [arrivals, setArrivals] = useState<NewArrival[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/catalog/new-arrivals");
        if (res.ok) {
          const data = await res.json();
          if (data.arrivals && data.arrivals.length > 0) {
            setArrivals(data.arrivals);
          }
        }
      } catch {
        // Silently handle fetch errors
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 240;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  // Don't render if no arrivals and done loading
  if (!isLoading && arrivals.length === 0) return null;

  return (
    <section className="relative">
      <div className="mx-auto max-w-site px-4 md:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
              Fresh Off the Shelf
            </p>
            <h2 className="text-h2 text-gray-800">New Arrivals</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:border-primary-border hover:text-primary transition-colors"
              aria-label="Scroll new arrivals left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 hover:border-primary-border hover:text-primary transition-colors"
              aria-label="Scroll new arrivals right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-8 snap-x snap-mandatory scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Left spacer for max-w-site alignment */}
        <div className="shrink-0 w-[max(0px,calc((100vw-1200px)/2))]" />

        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="min-w-[160px] max-w-[160px] snap-start shrink-0"
            >
              <div className="aspect-[2/3] rounded-xl bg-gray-200 animate-pulse" />
              <div className="mt-2 h-3 w-3/4 rounded bg-gray-200 animate-pulse" />
            </div>
          ))}

        {!isLoading &&
          arrivals.map((item) => (
            <a
              key={item.itemId}
              href={item.opacUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group min-w-[160px] max-w-[160px] snap-start shrink-0"
            >
              <div className="aspect-[2/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm group-hover:shadow-lg group-hover:border-primary-border transition-all duration-300">
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <p className="mt-2 text-xs font-medium text-gray-700 group-hover:text-primary-dark transition-colors line-clamp-2 leading-snug">
                {item.title}
              </p>
            </a>
          ))}

        {/* Right spacer */}
        <div className="shrink-0 w-[max(0px,calc((100vw-1200px)/2))]" />
      </div>
    </section>
  );
}
