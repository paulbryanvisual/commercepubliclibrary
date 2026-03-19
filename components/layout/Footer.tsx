import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";
import { LIBRARY_HOURS } from "@/lib/hours";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white" role="contentinfo">
      {/* Donate banner */}
      <div className="bg-primary-dark text-white">
        <div className="mx-auto max-w-site px-4 md:px-8 py-10 text-center">
          <h2 className="text-2xl font-medium mb-2">
            Support Your Library
          </h2>
          <p className="text-primary-200 mb-6 max-w-xl mx-auto">
            Commerce Public Library is a free {siteConfig.nonprofit.type}{" "}
            serving everyone in Hunt County. Your donation helps fund programs,
            resources, and community events.
          </p>
          <a
            href={siteConfig.givebutter}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary-dark hover:bg-primary-light transition-colors"
          >
            Donate Now
          </a>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-site px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">
              About
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Our Story
                </Link>
              </li>
              <li>
                <Link
                  href="/about#staff"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Staff & Board
                </Link>
              </li>
              <li>
                <Link
                  href="/about#donate"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Donate
                </Link>
              </li>
              <li>
                <Link
                  href="/about#volunteer"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Volunteer
                </Link>
              </li>
              <li>
                <Link
                  href="/get-card"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Get a Library Card
                </Link>
              </li>
            </ul>
          </div>

          {/* Services column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">
              Services
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/catalog"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Search Catalog
                </Link>
              </li>
              <li>
                <Link
                  href="/services/passport"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Passport Services
                </Link>
              </li>
              <li>
                <Link
                  href="/services/rooms"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Meeting Rooms
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Computers & WiFi
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Fax, Copy & Print
                </Link>
              </li>
            </ul>
          </div>

          {/* Digital Resources column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">
              Digital Resources
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/digital"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Libby / OverDrive
                </Link>
              </li>
              <li>
                <Link
                  href="/digital"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Hoopla
                </Link>
              </li>
              <li>
                <Link
                  href="/digital"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  TexShare Databases
                </Link>
              </li>
              <li>
                <Link
                  href="/history"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Local History
                </Link>
              </li>
              <li>
                <Link
                  href="/kids"
                  className="text-sm text-gray-500 hover:text-primary transition-colors"
                >
                  Kids Zone
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect column */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-4">
              Connect
            </h3>
            {/* Hours summary */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1.5">Hours</p>
              <div className="space-y-0.5 text-sm text-gray-500">
                {LIBRARY_HOURS.map((h) => (
                  <div key={h.day} className="flex justify-between">
                    <span>{h.day.slice(0, 3)}</span>
                    <span>
                      {h.closed ? "Closed" : `${h.open} – ${h.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-1.5 text-sm text-gray-500">
              <p>{siteConfig.address}</p>
              <p>
                <a
                  href={`tel:${siteConfig.phone.replace(/[^\d]/g, "")}`}
                  className="hover:text-primary transition-colors"
                >
                  {siteConfig.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-primary transition-colors"
                >
                  {siteConfig.email}
                </a>
              </p>
            </div>

            {/* Social links */}
            <div className="flex gap-3 mt-4">
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-gray-400 hover:text-primary hover:bg-primary-light transition-colors"
                aria-label="Facebook"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href={siteConfig.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg p-2 text-gray-400 hover:text-primary hover:bg-primary-light transition-colors"
                aria-label="Instagram"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Partner badges */}
      <div className="border-t border-gray-200">
        <div className="mx-auto max-w-site px-4 md:px-8 py-6 flex flex-wrap items-center justify-center gap-6">
          <img
            src="/images/accreditation-badge.png"
            alt="Accredited Library Member"
            className="h-14 w-auto opacity-70 hover:opacity-100 transition-opacity"
          />
          <img
            src="/images/united-way.jpg"
            alt="United Way partner"
            className="h-14 w-auto opacity-70 hover:opacity-100 transition-opacity"
          />
          <img
            src="/images/texshare-logo.png"
            alt="TexShare databases"
            className="h-10 w-auto opacity-70 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-site px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.nonprofit.name} &middot;{" "}
            {siteConfig.nonprofit.type}
          </p>
          <div className="flex gap-4">
            <Link href="/about#accessibility" className="hover:text-primary transition-colors">
              Accessibility
            </Link>
            <Link href="/about#privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
