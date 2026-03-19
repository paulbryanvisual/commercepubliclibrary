import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Local History & Genealogy",
  description:
    "Explore Commerce and Hunt County local history — photos, documents, genealogy databases, and the Commerce Journal digital archive.",
};

const genealogyDatabases = [
  {
    name: "Ancestry Library Edition",
    description: "In-library access to the full Ancestry database — census, vital records, immigration, military, and more.",
    access: "In-library only",
  },
  {
    name: "Fold3",
    description: "Military records — service records, pension files, draft registrations, and casualty lists.",
    access: "In-library + remote",
  },
  {
    name: "HeritageQuest",
    description: "Census records, books, and local histories. Complementary to Ancestry with unique content.",
    access: "Remote access available",
  },
  {
    name: "Commerce Journal Digital Archive",
    description: "Digitized Commerce Journal newspaper — searchable historical issues dating back decades.",
    access: "Free online",
  },
];

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1461360370896-922624d12571?w=1200&q=80"
          alt="Vintage library archive with historical documents and books"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <h1 className="text-h1 text-white mb-2">Local History & Genealogy</h1>
          <p className="text-base text-white/80 max-w-2xl leading-relaxed">
            Commerce Public Library maintains an extensive local history
            collection — books, photographs, memorabilia, and genealogy resources
            documenting Commerce and Hunt County from the late 1800s to today.
          </p>
        </div>
      </div>

      {/* Collection overview */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">Our Collection</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 text-gray-600 leading-relaxed space-y-4">
          <p>
            Our local history collection includes rare photographs, maps,
            documents, and memorabilia related to Commerce, Hunt County, and
            surrounding communities. Items date to the late 1800s, covering the
            growth of Commerce from its founding through the railroad era and
            beyond.
          </p>
          <p>Highlights include:</p>
          <ul className="space-y-2 ml-4">
            <li>&#x2022; Historical photographs: Commerce Depot (1974), fire & police chiefs (1931), railroad tracks, Black history, Neylandville schools</li>
            <li>&#x2022; Brigham family papers and Mary Belle Bean biographical materials</li>
            <li>&#x2022; Authors&apos; Park documentation and brick ceremony records</li>
            <li>&#x2022; Local church histories and community organization records</li>
            <li>&#x2022; Texas & Pacific Railroad documents</li>
          </ul>
          <p className="text-sm text-gray-500">
            Materials are available for in-library use. Staff can assist with
            locating specific items. Digitization of the collection is ongoing.
          </p>
        </div>
      </section>

      {/* Photo gallery placeholder */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">Historical Photos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Commerce Depot, 1974",
            "Downtown Commerce, early 1900s",
            "Fire & Police Chiefs, 1931",
            "Railroad Tracks",
            "Neylandville School",
            "Historic Post Office",
            "Brigham Family",
            "Commerce Main Street",
          ].map((caption, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden"
            >
              <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A3A29E" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <p className="px-3 py-2 text-xs text-gray-500">{caption}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Photo gallery will be populated via the AI admin interface
        </p>
      </section>

      {/* Commerce Journal Archive */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">
          Commerce Journal Digital Archive
        </h2>
        <div className="rounded-xl border border-blue-100 bg-blue-light p-6 md:p-8">
          <p className="text-gray-700 leading-relaxed mb-4">
            The Commerce Journal — the local newspaper of Commerce, Texas — has
            been digitized and is available for free online search. Browse
            historical issues, search for names, events, and more.
          </p>
          <a
            href={siteConfig.journalArchive}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg bg-blue text-white px-5 py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Search the Commerce Journal Archive &rarr;
          </a>
        </div>
      </section>

      {/* Genealogy databases */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">Genealogy Databases</h2>
        <p className="text-sm text-gray-500 mb-4">
          Free access to premium genealogy databases through your library card
          and the TexShare program.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {genealogyDatabases.map((db) => (
            <div
              key={db.name}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                {db.name}
              </h3>
              <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 mb-2">
                {db.access}
              </span>
              <p className="text-sm text-gray-600">{db.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Research help */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">Research Assistance</h2>
        <div className="rounded-xl border border-primary-border bg-primary-light p-6 md:p-8">
          <p className="text-gray-700 leading-relaxed mb-4">
            Need help with genealogy research or local history questions? Our
            staff can help you navigate the collection, locate records, and
            guide your research. For in-depth research requests, fill out the
            form below and a staff member will follow up.
          </p>
          <form className="space-y-4 max-w-lg">
            <div>
              <label htmlFor="research-name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input type="text" id="research-name" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="research-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input type="email" id="research-email" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label htmlFor="research-topic" className="block text-sm font-medium text-gray-700 mb-1">
                Research Topic / Question
              </label>
              <textarea id="research-topic" rows={4} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Describe what you're researching — family names, time period, specific events..." />
            </div>
            <button type="submit" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-mid transition-colors">
              Submit Research Request
            </button>
          </form>
        </div>
      </section>

      {/* Texas historical resources links */}
      <section>
        <h2 className="text-h2 text-gray-800 mb-4">
          More Texas History Resources
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-2 text-sm">
          {[
            { name: "Portal to Texas History", url: "https://texashistory.unt.edu" },
            { name: "Texas State Library & Archives", url: "https://www.tsl.texas.gov" },
            { name: "Find A Grave", url: "https://www.findagrave.com" },
            { name: "FamilySearch (free)", url: "https://www.familysearch.org" },
            { name: "Hunt County Historical Commission", url: "#" },
          ].map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-gray-600 hover:bg-primary-light hover:text-primary-dark transition-colors"
            >
              <span>{link.name}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
