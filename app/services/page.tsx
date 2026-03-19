import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore all services at Commerce Public Library — passport processing, meeting rooms, computers, printing, interlibrary loan, and more.",
};

const services = [
  {
    title: "Passport Acceptance Agency",
    description:
      "Commerce Public Library is an official U.S. passport acceptance facility. We process new passport applications and offer on-site passport photos.",
    href: "/services/passport",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M7 21v-1a5 5 0 0 1 10 0v1"/></svg>
    ),
    highlight: true,
  },
  {
    title: "Meeting Room",
    description:
      "Free public meeting room available for community groups, clubs, and organizations. Reserve online or call ahead.",
    href: "/services/rooms",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    ),
    highlight: false,
  },
  {
    title: "Computer Workstations & WiFi",
    description:
      "Free public computers with internet access. WiFi available throughout the building. Walk-in — no reservation needed.",
    href: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    ),
    highlight: false,
  },
  {
    title: "Device Lending",
    description:
      "Borrow Chromebooks, iPads, Kindles, and mobile hotspots with your library card. Take the internet home with you.",
    href: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
    ),
    highlight: false,
  },
  {
    title: "Fax, Copy & Print",
    description:
      "B&W copies $0.15/page, color copies $0.50/page, fax $1.00 first page + $0.50 each additional.",
    href: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    ),
    highlight: false,
  },
  {
    title: "GED & ESL Programs",
    description:
      "Free GED tutoring: Tuesdays & Thursdays, 10 AM – 12 PM. Free ESL classes to learn and improve your English.",
    href: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>
    ),
    highlight: false,
  },
  {
    title: "Interlibrary Loan (ILL)",
    description:
      "Can't find what you need? Request books and materials from other libraries across Texas and beyond.",
    href: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    ),
    highlight: false,
  },
  {
    title: "Community Seed Library",
    description:
      "Free community seed sharing program for flowers, vegetables, fruits, and herbs. Take seeds, grow plants, share the harvest.",
    href: null,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    ),
    highlight: false,
  },
];

const printPricing = [
  { service: "B&W copies", price: "$0.15 / page" },
  { service: "Color copies", price: "$0.50 / page" },
  { service: "Fax (first page)", price: "$1.00" },
  { service: "Fax (additional pages)", price: "$0.50 / page" },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80"
          alt="Modern library services area with technology and resources"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <h1 className="text-h1 text-white mb-2">Services</h1>
          <p className="text-base text-white/80 max-w-2xl leading-relaxed">
            Commerce Public Library offers much more than books. Explore
            everything we provide — all free with your library card.
          </p>
        </div>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        {services.map((service) => {
          const cardClass = `group rounded-xl border p-6 transition-all ${
            service.highlight
              ? "border-primary-border bg-primary-light hover:shadow-md"
              : "border-gray-200 bg-white hover:border-primary-border hover:shadow-md"
          }`;
          const content = (
            <div className="flex gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
                  service.highlight
                    ? "bg-primary text-white"
                    : "bg-primary-light text-primary group-hover:bg-primary group-hover:text-white"
                }`}
              >
                {service.icon}
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-1">
                  {service.title}
                  {service.highlight && (
                    <span className="ml-2 inline-block rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-white">
                      Popular
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {service.description}
                </p>
                {service.href && (
                  <span className="mt-2 inline-flex text-sm font-medium text-primary">
                    Learn more &rarr;
                  </span>
                )}
              </div>
            </div>
          );
          return service.href ? (
            <Link key={service.title} href={service.href} className={cardClass}>
              {content}
            </Link>
          ) : (
            <div key={service.title} className={cardClass}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Pricing table */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">
          Printing & Fax Pricing
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-700">
                  Service
                </th>
                <th className="text-right px-6 py-3 font-medium text-gray-700">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {printPricing.map((row, i) => (
                <tr
                  key={row.service}
                  className={i < printPricing.length - 1 ? "border-b border-gray-100" : ""}
                >
                  <td className="px-6 py-3 text-gray-600">{row.service}</td>
                  <td className="px-6 py-3 text-right text-gray-800 font-medium">
                    {row.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Additional resources */}
      <section>
        <h2 className="text-h2 text-gray-800 mb-4">Also Available</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 leading-relaxed space-y-2">
          <p>&#x2022; IRS tax forms (seasonal)</p>
          <p>&#x2022; Voter registration forms</p>
          <p>&#x2022; Newspapers and magazines</p>
          <p>&#x2022; Children&apos;s play-touch learning table</p>
          <p>&#x2022; Notary services (by appointment)</p>
        </div>
      </section>
    </div>
  );
}
