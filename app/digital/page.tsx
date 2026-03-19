import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Resources",
  description:
    "Access free ebooks, audiobooks, movies, and research databases with your Commerce Public Library card — Libby, Hoopla, TexShare, and more.",
};

const resources = [
  {
    title: "Libby / OverDrive",
    subtitle: "Ebooks & Audiobooks",
    description:
      "Borrow ebooks and audiobooks free with your Commerce Public Library card. Part of the NE Texas Digital Consortium — thousands of titles available. Download the Libby app on iOS, Android, or read in your browser.",
    color: "bg-blue-light border-blue-100",
    steps: [
      "Download the Libby app (iOS or Android) or visit libbyapp.com",
      "Search for 'Commerce Public Library' or 'NE Texas Digital Consortium'",
      "Sign in with your library card number",
      "Browse, borrow, and read — returned automatically!",
    ],
    link: "https://libbyapp.com",
    linkLabel: "Open Libby",
  },
  {
    title: "E-Read Texas (SimplyE)",
    subtitle: "Alternative Ebook Collection",
    description:
      "Another free ebook collection available through the SimplyE app. Different titles than Libby — check both for the widest selection.",
    color: "bg-primary-light border-primary-border",
    steps: [
      "Download the SimplyE app",
      "Select 'Commerce Public Library'",
      "Sign in with your library card",
      "Browse and borrow ebooks",
    ],
    link: "#",
    linkLabel: "Learn More",
  },
  {
    title: "Hoopla",
    subtitle: "Movies, Music, Ebooks & Comics",
    description:
      "Instant access to thousands of movies, TV shows, music albums, ebooks, audiobooks, and comics. No waitlists — borrow instantly, anytime. Includes content not available on Libby.",
    color: "bg-purple-light border-purple-100",
    steps: [
      "Download the Hoopla app or visit hoopladigital.com",
      "Create an account and select 'Commerce Public Library'",
      "Sign in with your library card number",
      "Borrow instantly — no holds, no waiting!",
    ],
    link: "https://hoopladigital.com",
    linkLabel: "Open Hoopla",
  },
  {
    title: "TexShare Databases",
    subtitle: "Research, Genealogy, Health & More",
    description:
      "Access 70+ premium databases free with your library card — including Ancestry Library Edition, Fold3 (military records), HeritageQuest, health databases, business resources, literature databases, and more. Provided through the Texas State Library's TexShare program.",
    color: "bg-amber-light border-amber-100",
    steps: [
      "Visit the TexShare database portal (ask staff for the current URL and password)",
      "Browse databases by subject: Genealogy, Health, Business, Literature, etc.",
      "Key databases: Ancestry Library, Fold3, HeritageQuest, Learning Express",
      "Some databases available in-library only; others accessible from home",
    ],
    link: "#",
    linkLabel: "Access Databases",
  },
];

export default function DigitalResourcesPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=1200&q=80"
          alt="Person reading on a tablet with digital content"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <h1 className="text-h1 text-white mb-2">Digital Resources</h1>
          <p className="text-base text-white/80 max-w-2xl leading-relaxed">
            Your library card unlocks thousands of free ebooks, audiobooks,
            movies, music, and research databases — accessible from anywhere.
          </p>
          <p className="text-sm text-white/60 mt-2">
            Don&apos;t have a card?{" "}
            <a href="/get-card" className="font-medium text-white underline">
              Get one free &rarr;
            </a>
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {resources.map((resource) => (
          <div
            key={resource.title}
            className={`rounded-xl border p-6 md:p-8 ${resource.color}`}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {resource.subtitle}
                </p>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">
                  {resource.title}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {resource.description}
                </p>
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-lg bg-white border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:border-primary-border hover:text-primary transition-colors"
                >
                  {resource.linkLabel} &rarr;
                </a>
              </div>
              <div className="md:w-80 shrink-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  How to Get Started
                </h3>
                <ol className="space-y-2">
                  {resource.steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-600">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-500 border border-gray-200">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <section className="mt-16">
        <h2 className="text-h2 text-gray-800 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "Do I need a library card to use these resources?",
              a: "Yes — all digital resources require a valid Commerce Public Library card. Cards are free for anyone within 60 miles of Commerce.",
            },
            {
              q: "Can I access these from home?",
              a: "Yes! Libby, Hoopla, and most TexShare databases are available from anywhere with an internet connection. Some TexShare databases (like Ancestry Library) may be in-library only.",
            },
            {
              q: "What devices can I use?",
              a: "Libby and Hoopla work on iOS, Android, Kindle Fire, and web browsers. Ebooks can also be read on Kindle e-readers via Libby.",
            },
            {
              q: "How many items can I borrow?",
              a: "Limits vary by platform. Libby typically allows 5-10 checkouts at a time. Hoopla allows several borrows per month. Both are generous for most readers.",
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
