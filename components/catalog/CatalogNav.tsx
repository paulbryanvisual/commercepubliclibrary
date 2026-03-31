"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/catalog", label: "Browse", icon: "M4 19.5A2.5 2.5 0 016.5 17H20" },
  { href: "/catalog/new-arrivals", label: "New Arrivals", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { href: "/catalog/dvds", label: "DVDs & Media", icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  { href: "/catalog/digital", label: "Digital Resources", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
];

export default function CatalogNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="mx-auto max-w-site px-4 md:px-8">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mb-px">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-[#1D9E75] text-[#1D9E75]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                >
                  <path d={tab.icon} />
                </svg>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
