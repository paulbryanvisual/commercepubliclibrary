import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Homeschool Resources | Commerce Public Library",
  description:
    "Free programs, materials, and support for homeschool families at Commerce Public Library — art studio, book collections, databases, and more.",
};

const programs = [
  {
    title: "Homeschool Art Studio",
    schedule: "Bi-weekly on Thursdays, 1:00 PM - 2:30 PM",
    ages: "Ages 5-14",
    description:
      "Each session features an age-appropriate art project connected to a theme in art history, science, or literature. Projects are adaptable for different skill levels. All materials provided.",
    color: "border-pink-200 bg-pink-50",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  },
  {
    title: "Lego Club",
    schedule: "Weekly on Wednesdays, 3:30 PM - 4:30 PM",
    ages: "Ages 5-12",
    description:
      "Build and create with our huge Lego collection. Optional weekly build challenges plus free building. Creations are displayed in the library for one week.",
    color: "border-green-200 bg-green-50",
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  },
  {
    title: "Preschool Story Time",
    schedule: "Weekly on Saturdays, 10:00 AM - 11:00 AM",
    ages: "Ages 3-6",
    description:
      "Two picture books read aloud, a sing-along, and a simple craft activity. Perfect for early learners. No registration needed — just drop in.",
    color: "border-blue-200 bg-blue-50",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    title: "Chess Club",
    schedule: "Weekly on Tuesdays, 4:00 PM - 5:30 PM",
    ages: "Ages 8+",
    description:
      "Learn strategy and critical thinking through chess. All skill levels welcome — beginners learn the basics, advanced players find challengers. We provide all sets.",
    color: "border-purple-200 bg-purple-50",
    icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  },
];

const resources = [
  {
    title: "Extensive Book Collection",
    description:
      "Over 12,000 items including picture books, early readers, chapter books, nonfiction, and reference materials organized by reading level and subject.",
    items: ["1,800+ Early Childhood picture books", "3,300+ Kids chapter books", "300+ Young Adult titles", "1,000+ Nonfiction across all subjects"],
  },
  {
    title: "Digital Learning Resources",
    description:
      "Free online databases and e-learning platforms accessible with your library card — from anywhere.",
    items: ["Khan Academy (all subjects, all grades)", "TexShare Learning Express (practice tests & skill building)", "Libby ebooks & audiobooks (thousands of titles)", "Hoopla (educational videos, comics, audiobooks)"],
  },
  {
    title: "Technology & Equipment",
    description:
      "Devices available for checkout and in-library use to support learning at home.",
    items: ["Chromebooks & iPads for checkout", "WiFi hotspots for home internet", "Maker Space access (3D printer, Cricut)", "Public computers with internet"],
  },
  {
    title: "Quiet Study Spaces",
    description:
      "Comfortable spaces for focused learning, group work, and testing.",
    items: ["Meeting rooms available for study groups", "Quiet reading areas", "Children's room with learning table", "Free WiFi throughout the building"],
  },
];

const faqs = [
  {
    q: "Do we need a library card?",
    a: "Yes, but cards are free! Anyone within 60 miles of Commerce can get one. Apply online or visit in person — it takes about 2 minutes.",
  },
  {
    q: "Can we check out textbooks or curriculum materials?",
    a: "We don't carry specific curriculum packages, but our nonfiction collection covers most school subjects. We can also request books from other libraries through interlibrary loan at no charge.",
  },
  {
    q: "Can homeschool groups use the meeting rooms?",
    a: "Yes! Our meeting rooms are available for homeschool co-op groups, study sessions, and classes. Rooms can be reserved in advance at no charge.",
  },
  {
    q: "Are the programs drop-in or do we need to register?",
    a: "It varies by program. Story Time and Lego Club are drop-in. Homeschool Art Studio and some special programs require registration. Check each event for details.",
  },
  {
    q: "Can library staff help with research projects?",
    a: "Absolutely! Our staff are happy to help students find resources, navigate databases, and develop research skills. Just ask at the front desk.",
  },
  {
    q: "Do you offer any standardized test prep resources?",
    a: "Yes! Through TexShare Learning Express, students have access to practice tests for SAT, ACT, GED, ASVAB, and more — all free with a library card.",
  },
];

export default function HomeschoolPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80"
          alt="Children learning and reading together"
          className="w-full h-48 md:h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white border border-white/30">
              Free Resources
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Homeschool Resources
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">
            Your library is a free extension of your homeschool classroom.
            Programs, books, technology, and community — all here for your family.
          </p>
        </div>
      </div>

      {/* Welcome message */}
      <div className="rounded-xl border border-[#1D9E75]/20 bg-[#1D9E75]/5 p-6 mb-12">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Welcome, Homeschool Families!
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Commerce Public Library is proud to support homeschool families in Hunt County and beyond.
          Whether you need books for a unit study, a quiet place to work, technology for research,
          or social activities for your kids, we&apos;re here to help. Our staff understands the
          unique needs of homeschooling families and we welcome you warmly.
        </p>
      </div>

      {/* Programs */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Programs for Homeschoolers
        </h2>
        <p className="text-gray-500 mb-8">
          Regularly scheduled activities perfect for homeschool families. All are free.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((prog) => (
            <div key={prog.title} className={`rounded-xl border p-5 ${prog.color}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={prog.icon} />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">{prog.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs text-gray-500">{prog.schedule}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 border border-gray-200">
                      {prog.ages}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{prog.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-600 hover:border-[#1D9E75] hover:text-[#1D9E75] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            View Full Events Calendar
          </Link>
        </div>
      </section>

      {/* Resources */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Resources for Home Learning
        </h2>
        <p className="text-gray-500 mb-8">
          Everything your homeschool needs — and it&apos;s all free with a library card.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {resources.map((res) => (
            <div key={res.title} className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-2">{res.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{res.description}</p>
              <ul className="space-y-1.5">
                {res.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" className="mt-0.5 shrink-0">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/catalog", label: "Browse Catalog", desc: "12,000+ titles" },
            { href: "/catalog/digital", label: "Digital Resources", desc: "Libby, Hoopla & more" },
            { href: "/services/makerspace", label: "Maker Space", desc: "3D printing & crafts" },
            { href: "/get-card", label: "Get a Card", desc: "Free, 2 minutes" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-gray-200 bg-white p-4 hover:border-[#1D9E75] hover:shadow-md transition-all group"
            >
              <p className="text-sm font-semibold text-gray-800 group-hover:text-[#1D9E75] transition-colors">
                {link.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">{faq.q}</h3>
              <p className="text-sm text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-[#1D9E75] to-[#178a65] p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Connect with Other Homeschool Families
        </h2>
        <p className="text-white/80 mb-6 max-w-xl mx-auto">
          Follow us on social media for program updates, homeschool tips, and community connections.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://facebook.com/CommercePL"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#1D9E75] hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
            Follow on Facebook
          </a>
          <a
            href="https://instagram.com/commercepubliclibrary"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border-2 border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
            </svg>
            Follow on Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
