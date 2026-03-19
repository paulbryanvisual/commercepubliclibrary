"use client";

import { getEventBySlug, buildIcsString } from "@/lib/events";

interface IcsDownloadButtonProps {
  slug: string;
  title: string;
}

export default function IcsDownloadButton({ slug, title }: IcsDownloadButtonProps) {
  const handleDownload = () => {
    const event = getEventBySlug(slug);
    if (!event) return;

    const icsContent = buildIcsString(event);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-primary-border hover:text-primary shadow-sm transition-all"
      aria-label={`Download iCal file for ${title}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Download .ics
    </button>
  );
}
