import type { Metadata } from "next";
import LibraryCardForm from "@/components/forms/LibraryCardForm";

export const metadata: Metadata = {
  title: "Get a Library Card",
  description:
    "Get a free Commerce Public Library card — available to everyone within 60 miles of Commerce, TX. Apply online and get instant digital access.",
};

export default function GetCardPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80"
          alt="Welcoming library entrance with warm light and books"
          className="w-full h-44 md:h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <h1 className="text-h1 text-white mb-2">Get a Library Card</h1>
          <p className="text-base text-white/80 max-w-2xl leading-relaxed">
            A Commerce Public Library card is free for everyone living within 60
            miles of Commerce, Texas. Apply online and get a temporary digital card
            number immediately — start borrowing ebooks today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application form */}
        <div className="lg:col-span-2">
          <LibraryCardForm />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* What happens next */}
          <div className="rounded-xl border border-primary-border bg-primary-light p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              What Happens Next
            </h3>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">
                  1
                </span>
                <span>
                  <strong>Instant:</strong> You&apos;ll receive a temporary
                  digital card number by email — use it immediately for ebooks
                  on Libby and Hoopla.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">
                  2
                </span>
                <span>
                  <strong>Within 3 days:</strong> Your physical card will be
                  mailed to your address — or pick it up same day at the
                  library.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">
                  3
                </span>
                <span>
                  <strong>You&apos;re set:</strong> Check out books, DVDs,
                  devices, access databases, attend events — all free.
                </span>
              </li>
            </ol>
          </div>

          {/* Eligibility */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Eligibility
            </h3>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li>&#x2022; Residents within 60 miles of Commerce, TX</li>
              <li>&#x2022; All ages (minors need parent/guardian signature)</li>
              <li>&#x2022; Valid ID and proof of address required for pickup</li>
              <li>&#x2022; A&M-Commerce students: bring your student ID</li>
            </ul>
          </div>

          {/* What you get */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              What Your Card Gets You
            </h3>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li>&#x2022; Borrow books, DVDs, audiobooks</li>
              <li>&#x2022; Borrow Chromebooks, iPads, hotspots</li>
              <li>&#x2022; Free ebooks & audiobooks (Libby, Hoopla)</li>
              <li>&#x2022; 70+ TexShare research databases</li>
              <li>&#x2022; Computer & WiFi access</li>
              <li>&#x2022; Meeting room reservations</li>
              <li>&#x2022; All programs & events</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
