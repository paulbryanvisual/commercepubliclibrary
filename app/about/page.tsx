import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Commerce Public Library — our history, mission, staff, board, and how to support us.",
};

const boardMembers = [
  "Board Member 1",
  "Board Member 2",
  "Board Member 3",
  "Board Member 4",
  "Board Member 5",
];

const staffMembers = [
  { name: "Gayle Gordon", role: "Library Director", email: "director@commercepubliclibrary.org" },
  { name: "Ashley Bryan", role: "GED/ESL Coordinator", email: "" },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1568667256549-094345857637?w=1200&q=80"
          alt="Beautiful library interior with warm lighting and bookshelves"
          className="w-full h-48 md:h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <h1 className="text-h1 text-white mb-2">About Us</h1>
          <p className="text-base text-white/80 max-w-2xl leading-relaxed">
            Commerce Public Library is a free public library providing materials
            which contribute to the informational and recreational needs of the
            community. Located in the historic former Post Office in downtown
            Commerce, Texas.
          </p>
        </div>
      </div>

      {/* Our Story */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">Our Story</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 space-y-4 text-gray-600 leading-relaxed">
          <p>
            Commerce Public Library has been serving the people of Hunt County
            and surrounding areas for decades. Housed in a beautifully preserved
            historic Post Office building at 1210 Park Street, the library is a
            cornerstone of the Commerce community.
          </p>
          <p>
            The library is operated by the{" "}
            <strong>Friends of the Commerce Public Library</strong>, a
            board-led 501(c)(3) nonprofit organization. This unique governance
            model means the library is sustained by community support —
            donations, volunteers, and passionate board members who believe in
            the power of free public access to information.
          </p>
          <p>
            Today, we offer far more than books. From passport processing and
            GED/ESL tutoring to Chromebook and hotspot lending, community events,
            a seed library, and extensive digital resources — we are the
            community&apos;s hub for learning, connection, and discovery.
          </p>
        </div>
      </section>

      {/* Staff Directory */}
      <section id="staff" className="mb-16 scroll-mt-24">
        <h2 className="text-h2 text-gray-800 mb-4">Staff</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {staffMembers.map((person) => (
            <div
              key={person.name}
              className="rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="h-16 w-16 rounded-full bg-primary-light flex items-center justify-center text-primary text-xl font-semibold mb-3">
                {person.name.charAt(0)}
              </div>
              <h3 className="text-base font-semibold text-gray-800">
                {person.name}
              </h3>
              <p className="text-sm text-gray-500">{person.role}</p>
              {person.email && (
                <a
                  href={`mailto:${person.email}`}
                  className="text-sm text-primary hover:text-primary-mid transition-colors mt-1 inline-block"
                >
                  {person.email}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Board of Directors */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">Board of Directors</h2>
        <p className="text-sm text-gray-500 mb-4">
          The {siteConfig.nonprofit.name} is governed by a volunteer board of
          directors.
        </p>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {boardMembers.map((name) => (
              <li key={name} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary-border" />
                {name}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 mt-4">
            Board member names will be updated via the AI admin interface.
          </p>
        </div>
      </section>

      {/* Donate */}
      <section id="donate" className="mb-16 scroll-mt-24">
        <h2 className="text-h2 text-gray-800 mb-4">Support Your Library</h2>
        <div className="rounded-xl border border-primary-border bg-primary-light p-6 md:p-8">
          {/* Membership banner from current site */}
          <div className="rounded-lg overflow-hidden mb-6">
            <img
              src="/images/membership-banner.png"
              alt="Become a sustaining member and keep the Commerce Public Library thriving"
              className="w-full h-auto"
            />
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            Commerce Public Library is a free {siteConfig.nonprofit.type}. Your
            donations help fund expanded services, art exhibitions, digital
            resources, GED/ESL programs, and community programming. Every dollar
            makes a difference.
          </p>
          <a
            href={siteConfig.givebutter}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-mid transition-colors"
          >
            Donate via Givebutter
          </a>
        </div>
      </section>

      {/* Volunteer */}
      <section id="volunteer" className="mb-16 scroll-mt-24">
        <h2 className="text-h2 text-gray-800 mb-4">Volunteer</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8">
          <p className="text-gray-600 leading-relaxed mb-4">
            We welcome volunteers for shelving, event help, GED/ESL tutoring,
            and more. Interested? Reach out to us.
          </p>
          <a
            href={`mailto:${siteConfig.email}?subject=Volunteer%20Interest`}
            className="inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-mid transition-colors"
          >
            Contact Us About Volunteering
          </a>
        </div>
      </section>

      {/* Book Donations */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">Book Donations</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 text-gray-600 leading-relaxed space-y-3">
          <p>
            We gratefully accept gently used book donations. Donated books may
            be added to the collection, sold in our book sale, or made available
            through our Amazon store — with all proceeds supporting the library.
          </p>
          <p className="text-sm text-gray-500">
            Please drop off donations during library hours at the front desk.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="mb-16">
        <h2 className="text-h2 text-gray-800 mb-4">Contact</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-800 mb-1">Address</p>
              <p className="text-gray-500">{siteConfig.address}</p>
            </div>
            <div>
              <p className="font-medium text-gray-800 mb-1">Phone</p>
              <p>
                <a
                  href={`tel:${siteConfig.phone.replace(/[^\d]/g, "")}`}
                  className="text-primary hover:text-primary-mid transition-colors"
                >
                  {siteConfig.phone}
                </a>
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-800 mb-1">Email</p>
              <p>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-primary hover:text-primary-mid transition-colors"
                >
                  {siteConfig.email}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility statement */}
      <section id="accessibility" className="mb-16 scroll-mt-24">
        <h2 className="text-h2 text-gray-800 mb-4">Accessibility</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 leading-relaxed space-y-3">
          <p>
            Commerce Public Library is committed to ensuring our website is
            accessible to all users, including those with disabilities. We aim to
            meet WCAG 2.1 Level AA standards throughout the site.
          </p>
          <p>
            If you encounter accessibility barriers on this site, please contact
            us at{" "}
            <a href={`mailto:${siteConfig.email}`} className="text-primary hover:text-primary-mid">
              {siteConfig.email}
            </a>{" "}
            and we will work to provide an accessible alternative.
          </p>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="scroll-mt-24">
        <h2 className="text-h2 text-gray-800 mb-4">Privacy Policy</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 leading-relaxed space-y-3">
          <p>
            Commerce Public Library respects your privacy. We collect only the
            information necessary to provide library services. Patron records are
            kept confidential in accordance with Texas state law.
          </p>
          <p>
            Reading history is opt-in only and visible only to you. We do not
            sell or share personal information with third parties.
          </p>
        </div>
      </section>
    </div>
  );
}
