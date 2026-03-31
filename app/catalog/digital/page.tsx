import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Resources | Books & Media",
  description:
    "Access free ebooks, audiobooks, movies, and research databases with your Commerce Public Library card.",
};

const resources = [
  {
    title: "Libby / OverDrive",
    subtitle: "Ebooks & Audiobooks",
    description:
      "Borrow ebooks and audiobooks free with your Commerce Public Library card. Part of the NE Texas Digital Consortium — thousands of titles available.",
    gradient: "from-orange-400 to-pink-500",
    bgColor: "bg-orange-50 border-orange-100",
    steps: [
      "Download the Libby app (iOS or Android) or visit libbyapp.com",
      "Search for 'Commerce Public Library'",
      "Sign in with your library card number",
      "Browse, borrow, and read — returned automatically!",
    ],
    link: "https://libbyapp.com",
    linkLabel: "Open Libby",
    features: ["No late fees", "Auto-return", "Read on any device", "Kindle compatible"],
  },
  {
    title: "Hoopla",
    subtitle: "Movies, Music, Ebooks & Comics",
    description:
      "Instant access to thousands of movies, TV shows, music albums, ebooks, audiobooks, and comics. No waitlists — borrow instantly, anytime.",
    gradient: "from-purple-500 to-indigo-600",
    bgColor: "bg-purple-50 border-purple-100",
    steps: [
      "Download the Hoopla app or visit hoopladigital.com",
      "Create an account and select 'Commerce Public Library'",
      "Sign in with your library card number",
      "Borrow instantly — no holds, no waiting!",
    ],
    link: "https://hoopladigital.com",
    linkLabel: "Open Hoopla",
    features: ["No waitlists", "Stream or download", "Movies & TV", "Music albums"],
  },
  {
    title: "E-Read Texas (SimplyE)",
    subtitle: "Alternative Ebook Collection",
    description:
      "Another free ebook collection available through the SimplyE app. Different titles than Libby — check both for the widest selection.",
    gradient: "from-teal-500 to-cyan-600",
    bgColor: "bg-teal-50 border-teal-100",
    steps: [
      "Download the SimplyE app",
      "Select 'Commerce Public Library'",
      "Sign in with your library card",
      "Browse and borrow ebooks",
    ],
    link: "#",
    linkLabel: "Learn More",
    features: ["Free ebooks", "Easy app", "Different selection", "State program"],
  },
  {
    title: "TexShare Databases",
    subtitle: "Research, Genealogy, Health & More",
    description:
      "Access 70+ premium databases free with your library card — including Ancestry Library Edition, Fold3, HeritageQuest, health databases, and more.",
    gradient: "from-amber-500 to-orange-600",
    bgColor: "bg-amber-50 border-amber-100",
    steps: [
      "Ask staff for the current TexShare URL and password",
      "Browse databases by subject",
      "Key databases: Ancestry Library, Fold3, HeritageQuest, Learning Express",
      "Some databases available in-library only",
    ],
    link: "#",
    linkLabel: "Access Databases",
    features: ["70+ databases", "Ancestry Library", "Genealogy", "Academic research"],
  },
];

export default function DigitalResourcesPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
          Digital Resources
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl">
          Your library card unlocks thousands of free ebooks, audiobooks,
          movies, music, and research databases — accessible from anywhere.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Don&apos;t have a card?{" "}
          <a href="/get-card" className="font-medium text-[#1D9E75] hover:underline">
            Get one free &rarr;
          </a>
        </p>
      </div>

      {/* Resource cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {resources.map((resource) => (
          <div
            key={resource.title}
            className={`rounded-2xl border p-6 ${resource.bgColor} relative overflow-hidden`}
          >
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${resource.gradient}`} />

            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {resource.subtitle}
            </p>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {resource.title}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {resource.description}
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {resource.features.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-white/80 border border-gray-200 px-2.5 py-0.5 text-[11px] font-medium text-gray-600"
                >
                  {f}
                </span>
              ))}
            </div>

            {/* Steps accordion */}
            <details className="mb-4 group">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-[#1D9E75] transition-colors flex items-center gap-1">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="transition-transform group-open:rotate-90"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
                How to Get Started
              </summary>
              <ol className="mt-3 space-y-2 pl-5">
                {resource.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-gray-500 border border-gray-200">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </details>

            <a
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex rounded-lg bg-gradient-to-r ${resource.gradient} px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg transition-shadow`}
            >
              {resource.linkLabel} &rarr;
            </a>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              q: "Do I need a library card?",
              a: "Yes — all digital resources require a valid Commerce Public Library card. Cards are free for anyone within 60 miles of Commerce.",
            },
            {
              q: "Can I access these from home?",
              a: "Yes! Libby, Hoopla, and most TexShare databases work anywhere with internet. Some TexShare databases may be in-library only.",
            },
            {
              q: "What devices can I use?",
              a: "Libby and Hoopla work on iOS, Android, Kindle Fire, and web browsers. Ebooks can be read on Kindle e-readers via Libby.",
            },
            {
              q: "How many items can I borrow?",
              a: "Libby typically allows 5-10 checkouts at a time. Hoopla allows several borrows per month. Both are generous for most readers.",
            },
          ].map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                {faq.q}
              </h3>
              <p className="text-sm text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
