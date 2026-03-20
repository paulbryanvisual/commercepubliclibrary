"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { navLinks } from "@/lib/siteConfig";
import Logo from "@/components/ui/Logo";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm transition-all duration-200 ${
        scrolled ? "py-1.5 shadow-sm" : "py-2.5"
      }`}
      role="banner"
    >
      <div className="mx-auto flex max-w-site items-center justify-between px-4 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="hover:opacity-90 transition-opacity shrink-0"
          aria-label="Commerce Public Library — Home"
        >
          <Logo size={scrolled ? "sm" : "md"} />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden lg:flex items-center gap-0.5"
          role="navigation"
          aria-label="Main navigation"
        >
          {navLinks.map((link) =>
            link.children ? (
              /* Services dropdown */
              <div key={link.href} className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  onMouseEnter={() => setServicesOpen(true)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    servicesOpen
                      ? "bg-primary-light text-primary-dark"
                      : "text-gray-600 hover:bg-primary-light hover:text-primary-dark"
                  }`}
                  aria-expanded={servicesOpen}
                  aria-haspopup="true"
                >
                  {link.label}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className={`transition-transform ${servicesOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {servicesOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg shadow-black/8 animate-fade-in"
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2.5 text-[13px] font-medium text-gray-600 hover:bg-primary-light hover:text-primary-dark transition-colors"
                        onClick={() => setServicesOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-[13px] font-medium text-gray-600 hover:bg-primary-light hover:text-primary-dark transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Header utilities */}
        <div className="flex items-center gap-2">
          <Link
            href="/account"
            className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="My Account"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="hidden md:inline text-[13px]">My Account</span>
          </Link>
          <Link
            href="/get-card"
            className="hidden sm:inline-flex rounded-lg bg-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-primary-mid transition-colors shadow-sm shadow-primary/20"
          >
            Get a Card
          </Link>

          {/* Mobile menu button */}
          <button
            className="lg:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden border-t border-gray-200 bg-white animate-slide-up"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto max-w-site px-4 py-4 space-y-1">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.href}>
                  <button
                    onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                    className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-primary-light hover:text-primary-dark transition-colors"
                  >
                    {link.label}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform ${mobileServicesOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {mobileServicesOpen && (
                    <div className="ml-4 space-y-1 border-l-2 border-primary-light pl-3">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block rounded-lg px-4 py-2.5 text-[15px] font-medium text-gray-600 hover:bg-primary-light hover:text-primary-dark transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-primary-light hover:text-primary-dark transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <hr className="my-2 border-gray-200" />
            <Link
              href="/account"
              className="block rounded-lg px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              My Account
            </Link>
            <Link
              href="/get-card"
              className="block rounded-lg bg-primary px-4 py-3 text-center text-base font-semibold text-white hover:bg-primary-mid"
              onClick={() => setMobileMenuOpen(false)}
            >
              Get a Library Card
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
