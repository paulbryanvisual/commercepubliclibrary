import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kids Zone",
  description:
    "Story times, Lego club, summer reading, homework help, and more for kids and teens at Commerce Public Library.",
};

const ageGroups = [
  {
    name: "Babies & Toddlers",
    ages: "0-3 years",
    programs: ["Baby Lap Sit Story Time", "Toddler Play & Learn"],
    resources: ["Board books collection", "Play-touch learning table"],
    color: "bg-pink-50 border-pink-200",
  },
  {
    name: "Early Readers",
    ages: "K-2nd Grade",
    programs: ["Preschool Story Time", "Read to a Dog"],
    resources: ["Easy readers", "Picture books", "KidZviZ catalog"],
    color: "bg-green-light border-green-200",
  },
  {
    name: "Middle Grade",
    ages: "3rd-5th Grade",
    programs: ["Lego Club", "Homeschool Art Studio", "Book Bingo"],
    resources: ["Chapter books", "Homework help databases", "Graphic novels"],
    color: "bg-blue-light border-blue-100",
  },
  {
    name: "Tweens & Teens",
    ages: "6th-12th Grade",
    programs: ["Teen Art Studio", "Teen Book Club", "Gaming Night"],
    resources: ["YA collection", "Study spaces", "TexShare databases"],
    color: "bg-purple-light border-purple-100",
  },
];

const homeworkHelp = [
  { name: "Khan Academy", url: "https://www.khanacademy.org", description: "Free math, science, and more for all grade levels" },
  { name: "TexShare Learning Express", url: "#", description: "Practice tests, skill building, and tutoring" },
  { name: "KidZviZ Catalog", url: "#", description: "Search the library catalog with our kid-friendly interface" },
];

export default function KidsPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80"
          alt="Children reading and learning together in a colorful library space"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <h1 className="text-h1 text-white mb-2">Kids Zone</h1>
          <p className="text-base text-white/80 max-w-2xl leading-relaxed">
            The library is for everyone — especially kids! From story times for
            babies to teen art studios, we have programs, books, and resources for
            every age. All events are free and open to the public.
          </p>
        </div>
      </div>

      {/* Age groups */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-6">By Age Group</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ageGroups.map((group) => (
            <div
              key={group.name}
              className={`rounded-xl border p-6 ${group.color}`}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                {group.name}
              </h3>
              <p className="text-xs text-gray-500 mb-4">{group.ages}</p>

              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Programs
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.programs.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-white/80 px-2.5 py-1 text-xs text-gray-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Resources
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {group.resources.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-white/80 px-2.5 py-1 text-xs text-gray-700"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming kids events */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-h2 text-gray-800">Upcoming Kids Events</h2>
          <Link
            href="/events?audience=kids"
            className="text-sm font-medium text-primary hover:text-primary-mid transition-colors"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { title: "Story Time", date: "Saturday, 10:00 AM", audience: "Ages 3-6" },
            { title: "Lego Club", date: "Wednesday, 3:30 PM", audience: "Ages 5-12" },
            { title: "Teen Art Studio", date: "Friday, 4:00 PM", audience: "Ages 12-18" },
          ].map((event, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-base font-medium text-gray-800 mb-1">
                {event.title}
              </h3>
              <p className="text-sm text-gray-500">{event.date}</p>
              <span className="mt-2 inline-block rounded-full bg-green-light px-2.5 py-0.5 text-xs font-medium text-green-500">
                {event.audience}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Summer reading */}
      <section className="mb-16">
        <div className="rounded-xl border border-amber-light bg-amber-light p-6 md:p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Summer Reading Challenge
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Every summer, kids can join our reading challenge — log books, earn
            badges, and win prizes! The challenge tracker will be available here
            when summer reading kicks off.
          </p>
          <span className="inline-block rounded-full bg-amber/20 px-3 py-1 text-xs font-medium text-amber">
            Coming Summer 2026
          </span>
        </div>
      </section>

      {/* Homework help */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">Homework Help</h2>
        <div className="space-y-3">
          {homeworkHelp.map((resource) => (
            <a
              key={resource.name}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 hover:border-primary-border hover:shadow-sm transition-all"
            >
              <div>
                <h3 className="text-base font-medium text-gray-800">
                  {resource.name}
                </h3>
                <p className="text-sm text-gray-500">{resource.description}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#73726c" strokeWidth="2" className="shrink-0 ml-4" aria-hidden="true">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </a>
          ))}
        </div>
      </section>

      {/* Staff picks for kids */}
      <section>
        <h2 className="text-h2 text-gray-800 mb-4">
          Staff Picks for Young Readers
        </h2>
        <p className="text-sm text-gray-400">
          Staff reading recommendations for each age group will be managed via
          the AI admin interface — coming in Phase 3.
        </p>
      </section>
    </div>
  );
}
