"use client";

/**
 * Social Media Feed component
 *
 * Embeds Facebook page posts and links to Instagram.
 * Uses the Facebook Page Plugin (iframe embed) which doesn't require
 * an API key — it's the officially supported way to embed a page feed.
 *
 * Also provides social proof CTAs and follow buttons.
 */

export default function SocialFeed({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "" : "space-y-6"}>
      {/* Facebook embed */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="h-8 w-8 rounded-full bg-[#1877F2] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Commerce Public Library</p>
            <p className="text-xs text-gray-400">@CommercePL</p>
          </div>
          <a
            href="https://facebook.com/CommercePL"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto rounded-lg bg-[#1877F2] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#1664d9] transition-colors"
          >
            Follow
          </a>
        </div>
        <div className="flex justify-center p-4">
          <iframe
            src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FCommercePL&tabs=timeline&width=500&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
            width="500"
            height={compact ? 350 : 500}
            style={{ border: "none", overflow: "hidden", maxWidth: "100%" }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            title="Commerce Public Library Facebook Feed"
          />
        </div>
      </div>

      {/* Instagram CTA */}
      {!compact && (
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Follow us on Instagram
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Behind-the-scenes, new arrivals, event photos, and community moments.
          </p>
          <a
            href="https://instagram.com/commercepubliclibrary"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-6 py-3 text-sm font-semibold text-white hover:shadow-lg transition-shadow"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
            </svg>
            @commercepubliclibrary
          </a>
        </div>
      )}
    </div>
  );
}

/**
 * Compact social follow bar — for embedding in sidebars and footers.
 */
export function SocialFollowBar() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href="https://facebook.com/CommercePL"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#1664d9] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
        Facebook
      </a>
      <a
        href="https://instagram.com/commercepubliclibrary"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-4 py-2 text-sm font-medium text-white hover:shadow-lg transition-shadow"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        </svg>
        Instagram
      </a>
    </div>
  );
}
