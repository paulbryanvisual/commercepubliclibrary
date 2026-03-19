"use client";

import { useEffect, useState } from "react";
import { getLibraryStatus } from "@/lib/hours";

export default function StatusPill() {
  const [status, setStatus] = useState<{
    isOpen: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setStatus(getLibraryStatus());
    // Refresh every minute
    const interval = setInterval(() => setStatus(getLibraryStatus()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        status.isOpen
          ? "bg-green-light text-green-500"
          : "bg-gray-100 text-gray-500"
      }`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status.isOpen
            ? "bg-green-500 animate-pulse-dot"
            : "bg-gray-400"
        }`}
        aria-hidden="true"
      />
      {status.message}
    </span>
  );
}
