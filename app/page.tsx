import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";
import { LIBRARY_HOURS } from "@/lib/hours";
import StatusPill from "@/components/ui/StatusPill";
import HeroIllustration from "@/components/ui/HeroIllustration";
import EventsCarousel from "@/components/events/EventsCarousel";
import { getPublishedData, getAllData } from "@/lib/cms/dataStore";

// No caching — always fetch fresh CMS data (preview must be instant)
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ─── Quick actions ───

const quickActions = [
  {
    title: "My Account",
    description: "Checkouts, holds & fines",
    href: "/account",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    ),
    gradient: "from-primary/10 to-primary/5",
  },
  {
    title: "Get a Card",
    description: "Free — apply in 2 minutes",
    href: "/get-card",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
    ),
    gradient: "from-blue/10 to-blue/5",
  },
  {
    title: "Book a Room",
    description: "Free meeting space",
    href: "/services/rooms",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    ),
    gradient: "from-purple/10 to-purple/5",
  },
  {
    title: "Passports",
    description: "Book an appointment",
    href: "/services/passport",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M7 21v-1a5 5 0 0 1 10 0v1"/></svg>
    ),
    gradient: "from-amber/10 to-amber/5",
  },
];

// ─── Digital resources ───

const digitalResources = [
  {
    title: "Libby / OverDrive",
    subtitle: "Ebooks & Audiobooks",
    description: "Thousands of ebooks and audiobooks — free with your library card.",
    href: "/digital",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
    ),
    color: "border-blue-100 bg-gradient-to-br from-blue-light to-white",
  },
  {
    title: "Hoopla",
    subtitle: "Movies, Music & More",
    description: "Instant access — no waitlists. Movies, music, ebooks, and comics.",
    href: "/digital",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple"><polygon points="5 3 19 12 5 21 5 3"/></svg>
    ),
    color: "border-purple-100 bg-gradient-to-br from-purple-light to-white",
  },
  {
    title: "TexShare Databases",
    subtitle: "Research & Genealogy",
    description: "Ancestry Library, Fold3, and 70+ premium databases — all free.",
    href: "/digital",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
    ),
    color: "border-primary-border bg-gradient-to-br from-primary-light to-white",
  },
];

// ─── Staff picks ───

const staffPicks = [
  { title: "The Women", author: "Kristin Hannah", quote: "A powerful story of courage during the Vietnam era — our most requested book this year.", librarian: "Gayle", cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80" },
  { title: "Demon Copperhead", author: "Barbara Kingsolver", quote: "A stunning Pulitzer-winning retelling of David Copperfield set in Appalachia.", librarian: "Ashley", cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80" },
  { title: "The Heaven & Earth Grocery Store", author: "James McBride", quote: "A beautiful, sprawling story about a small community that will stay with you.", librarian: "Gayle", cover: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&q=80" },
  { title: "Holly", author: "Stephen King", quote: "Classic King — suspenseful, addictive, and impossible to put down.", librarian: "Ashley", cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80" },
];

// ─── Stats ───

const stats = [
  { value: "20,000+", label: "Books & media" },
  { value: "Free", label: "For everyone" },
  { value: "60 mi", label: "Service area" },
  { value: "1890s", label: "Historic building" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: { preview?: string };
}) {
  const isPreview = searchParams?.preview === "true";
  const cms = isPreview ? await getAllData() : await getPublishedData();
  const cmsPageContent = cms.pageContent?.home || {};

  // Use CMS hero image if set, otherwise use default illustration
  const heroImageUrl = cmsPageContent.hero_image || cmsPageContent.hero || null;
  const heroTitle = cmsPageContent.hero_title || null;
  const heroSubtitle = cmsPageContent.hero_subtitle || null;
  const heroDescription = cmsPageContent.hero_description || null;
  // CMS-controlled colors — accepts any valid CSS color or gradient string
  const heroBgColor = cmsPageContent.hero_bg_color || null;       // e.g. "#556B2F" or "linear-gradient(...)"
  const heroAccentColor = cmsPageContent.hero_accent_color || null; // e.g. "#9DC183" (subtitle / chip color)

  // Use CMS staff picks if any exist, otherwise use defaults
  const cmsStaffPicks = cms.staffPicks.length > 0 ? cms.staffPicks : null;

  // Use CMS announcements
  const activeAnnouncements = cms.announcements;

  const currentDayIndex = new Date().getDay();
  const mappedIndex = currentDayIndex === 0 ? 6 : currentDayIndex - 1;

  return (
    <div className="min-h-screen">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        {/* Background — CMS color overrides the default teal gradient when set */}
        {heroBgColor ? (
          <div className="absolute inset-0" style={{ background: heroBgColor }} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary-mid to-primary-300" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(93,202,165,0.2),transparent_60%)]" />

        <div className="relative mx-auto max-w-site px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-12 md:py-20">
            {/* Left: Text */}
            <div className="relative z-10">
              <h1 className="text-4xl md:text-[52px] font-semibold text-white leading-[1.1] mb-5 tracking-tight">
                <span
                  data-cms-editable="true"
                  data-cms-page="home"
                  data-cms-section="hero_title"
                  suppressHydrationWarning
                >{heroTitle || "Your library."}</span>
                <br />
                <span
                  className="text-primary-200"
                  style={heroAccentColor ? { color: heroAccentColor } : undefined}
                  data-cms-editable="true"
                  data-cms-page="home"
                  data-cms-section="hero_subtitle"
                  suppressHydrationWarning
                >{heroSubtitle || "Your community."}</span>
              </h1>
              <p
                className="text-lg md:text-xl text-primary-100/90 mb-8 max-w-md leading-relaxed"
                data-cms-editable="true"
                data-cms-page="home"
                data-cms-section="hero_description"
                suppressHydrationWarning
              >
                {heroDescription || "Free books, ebooks, events, passport services, and more — for everyone in Hunt County."}
              </p>

              {/* Search bar */}
              <div className="flex items-center rounded-2xl bg-white p-1.5 shadow-xl shadow-black/10 max-w-xl ring-1 ring-white/20">
                <div className="flex-1 flex items-center gap-2.5 px-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#73726c" strokeWidth="2" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search books, events, services..."
                    className="w-full bg-transparent py-2.5 text-sm text-gray-700 placeholder-gray-400 outline-none"
                    aria-label="Search the library"
                  />
                </div>
                <button className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-mid transition-colors shadow-sm">
                  Search
                </button>
              </div>

              {/* Quick chips */}
              <div className="flex flex-wrap gap-2 mt-5">
                {[
                  { label: "Borrow ebooks", href: "/digital", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
                  { label: "Events", href: "/events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
                  { label: "Passport", href: "/services/passport", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                  { label: "Kids", href: "/kids", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
                  { label: "Catalog", href: "/catalog", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
                ].map((chip) => (
                  <Link
                    key={chip.label}
                    href={chip.href}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3.5 py-1.5 text-sm text-white/90 hover:bg-white/20 hover:border-white/25 transition-all backdrop-blur-sm"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={chip.icon} />
                    </svg>
                    {chip.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: Photo */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-white/10">
                {heroImageUrl ? (
                  <img src={heroImageUrl} alt="Commerce Public Library" className="w-full h-auto object-cover" />
                ) : (
                  <HeroIllustration className="w-full h-auto" />
                )}
              </div>
              {/* Floating card overlay */}
              <div className="absolute -bottom-4 -left-8 rounded-xl bg-white p-4 shadow-lg border border-gray-100 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">20,000+ items</p>
                    <p className="text-xs text-gray-500">Books, ebooks, DVDs & more</p>
                  </div>
                </div>
              </div>
              {/* Second floating card */}
              <div className="absolute -top-3 -right-6 rounded-xl bg-white p-3.5 shadow-lg border border-gray-100 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-purple-light flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">AI Assistant</p>
                    <p className="text-[10px] text-gray-500">Ask me anything</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z" fill="#F8F7F4"/>
          </svg>
        </div>
      </section>

      {/* ─── ANNOUNCEMENTS (from CMS) ─── */}
      {activeAnnouncements.length > 0 && (
        <section className="mx-auto max-w-site px-4 md:px-8 mb-4 relative z-10">
          {activeAnnouncements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl p-4 mb-2 flex items-start gap-3 ${
                a.type === "alert" ? "bg-red-50 border border-red-200 text-red-800" :
                a.type === "closure" ? "bg-amber-50 border border-amber-200 text-amber-800" :
                a.type === "celebration" ? "bg-purple-50 border border-purple-200 text-purple-800" :
                "bg-blue-50 border border-blue-200 text-blue-800"
              } ${a.status === "draft" && isPreview ? "ring-2 ring-amber-400 ring-dashed" : ""}`}
            >
              <div className="flex-1">
                <p className="font-semibold text-sm">{a.title}</p>
                <p className="text-sm mt-0.5">{a.body}</p>
              </div>
              {a.status === "draft" && isPreview && (
                <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">DRAFT</span>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ─── QUICK ACTIONS ─── */}
      <section className="mx-auto max-w-site px-4 md:px-8 -mt-2 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`group relative flex flex-col items-center gap-2.5 rounded-2xl border border-gray-200/80 bg-gradient-to-br ${action.gradient} p-5 md:p-6 text-center shadow-sm hover:shadow-lg hover:border-primary-border hover:-translate-y-0.5 transition-all duration-300`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                {action.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── STATUS + HOURS ─── */}
      <section className="mx-auto max-w-site px-4 md:px-8 mt-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <StatusPill />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500">
            {LIBRARY_HOURS.map((h, i) => (
              <span key={h.day} className={`${i === mappedIndex ? "font-semibold text-primary" : ""}`}>
                {h.day.slice(0, 3)}: {h.closed ? "Closed" : `${h.open} – ${h.close}`}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── UPCOMING EVENTS CAROUSEL ─── */}
      <div className="mt-16">
        <EventsCarousel />
      </div>

      {/* ─── STATS STRIP ─── */}
      <section className="mx-auto max-w-site px-4 md:px-8 mt-16">
        <div className="rounded-2xl bg-gradient-to-r from-primary-dark via-primary-mid to-primary overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {stats.map((stat) => (
              <div key={stat.label} className="p-6 md:p-8 text-center">
                <p className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-xs md:text-sm text-primary-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── NEW ARRIVALS ─── */}
      <section className="mx-auto max-w-site px-4 md:px-8 mt-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
              Just Added
            </p>
            <h2 className="text-h2 text-gray-800">New Arrivals</h2>
          </div>
          <Link
            href="/catalog?filter=new"
            className="rounded-lg bg-primary-light px-4 py-2 text-sm font-medium text-primary-dark hover:bg-primary-200 transition-colors"
          >
            Browse all &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { title: "The Women", author: "Kristin Hannah", img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80" },
            { title: "Demon Copperhead", author: "Barbara Kingsolver", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&q=80" },
            { title: "Holly", author: "Stephen King", img: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&q=80" },
            { title: "Tom Clancy: Red Storm", author: "Tom Clancy", img: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&q=80" },
            { title: "Iron Flame", author: "Rebecca Yarros", img: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300&q=80" },
          ].map((book, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[2/3] relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={book.img}
                  alt={`Cover of ${book.title} by ${book.author}`}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Spine effect */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/15 to-transparent" />
                {/* Title overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 pt-8">
                  <p className="text-xs font-bold text-white/90 leading-tight line-clamp-1">{book.title}</p>
                  <p className="text-[10px] text-white/60">{book.author}</p>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-800 line-clamp-1 group-hover:text-primary-dark transition-colors">
                  {book.title}
                </p>
                <p className="text-xs text-gray-500">{book.author}</p>
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-light px-2 py-0.5 text-[11px] font-medium text-green-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  On shelf
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DIGITAL RESOURCES ─── */}
      <section className="mx-auto max-w-site px-4 md:px-8 mt-16">
        <div className="mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Read Anywhere
          </p>
          <h2 className="text-h2 text-gray-800">Digital Resources</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {digitalResources.map((resource) => (
            <Link
              key={resource.title}
              href={resource.href}
              className={`group rounded-2xl border p-6 ${resource.color} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}
            >
              <div className="mb-3">{resource.icon}</div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {resource.subtitle}
              </p>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-primary-dark transition-colors">
                {resource.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {resource.description}
              </p>
              <span className="mt-3 inline-flex text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── STAFF PICKS ─── */}
      <section className="mt-16 py-16 bg-gradient-to-br from-primary-dark via-primary-700 to-primary-mid relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(93,202,165,0.15),transparent_50%)]" />
        <div className="relative mx-auto max-w-site px-4 md:px-8">
          <div className="mb-8">
            <p className="text-xs font-semibold text-primary-200 uppercase tracking-widest mb-1">
              Recommended
            </p>
            <h2 className="text-h2 text-white">Staff Picks</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(cmsStaffPicks || staffPicks).map((pick, i) => {
              // Normalize CMS vs hardcoded format
              const title = "staffName" in pick ? pick.title : pick.title;
              const author = "staffName" in pick ? pick.author : pick.author;
              const review = "staffName" in pick ? pick.review : (pick as typeof staffPicks[0]).quote;
              const name = "staffName" in pick ? pick.staffName : (pick as typeof staffPicks[0]).librarian;
              const cover = "staffName" in pick ? (pick.imageUrl || `https://covers.openlibrary.org/b/isbn/${pick.isbn}-M.jpg`) : (pick as typeof staffPicks[0]).cover;
              const isDraft = "status" in pick && pick.status === "draft";

              return (
                <div
                  key={i}
                  className={`group rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-5 hover:bg-white/15 hover:border-white/20 transition-all ${isDraft && isPreview ? "ring-2 ring-amber-400 ring-dashed" : ""}`}
                >
                  {isDraft && isPreview && (
                    <span className="inline-block rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900 mb-2">DRAFT</span>
                  )}
                  {/* Book cover image */}
                  <div className="h-44 rounded-xl mb-4 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover}
                      alt={`Cover of ${title}`}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-black/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-0.5">
                    {title}
                  </h3>
                  <p className="text-xs text-primary-200 mb-2">{author}</p>
                  <p className="text-xs text-white/60 italic leading-relaxed line-clamp-3">
                    &ldquo;{review}&rdquo;
                  </p>
                  <p className="text-[11px] text-primary-300 mt-2">
                    — {name}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SERVICES HIGHLIGHTS ─── */}
      <section className="mx-auto max-w-site px-4 md:px-8 mt-16">
        <div className="mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            More Than Books
          </p>
          <h2 className="text-h2 text-gray-800">Services & Programs</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: "Passport Services",
              desc: "Official U.S. passport acceptance facility. New applications, photos, and processing.",
              href: "/services/passport",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M7 21v-1a5 5 0 0 1 10 0v1"/></svg>
              ),
              badge: "Popular",
            },
            {
              title: "GED & ESL Programs",
              desc: "Free GED tutoring (Tue & Thu) and ESL classes. Open to everyone.",
              href: "/services",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>
              ),
              badge: null,
            },
            {
              title: "Device Lending",
              desc: "Borrow Chromebooks, iPads, Kindles, and mobile hotspots.",
              href: "/services",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              ),
              badge: null,
            },
            {
              title: "Community Seed Library",
              desc: "Free seeds for flowers, vegetables, and herbs. Grow and share!",
              href: "/services",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              ),
              badge: null,
            },
            {
              title: "Kids Programs",
              desc: "Story time, Lego club, art studio, summer reading — all ages.",
              href: "/kids",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              ),
              badge: null,
            },
            {
              title: "Local History",
              desc: "Rare photos and documents from 1890s Commerce. Genealogy databases.",
              href: "/history",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              ),
              badge: null,
            },
          ].map((svc) => (
            <Link
              key={svc.title}
              href={svc.href}
              className="group flex items-start gap-4 rounded-2xl border border-gray-200/80 bg-white p-5 hover:shadow-lg hover:border-primary-border hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                {svc.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-primary-dark transition-colors">
                    {svc.title}
                  </h3>
                  {svc.badge && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">
                      {svc.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {svc.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link
            href="/services"
            className="inline-flex rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 hover:border-primary-border hover:text-primary transition-colors"
          >
            View all services &rarr;
          </Link>
        </div>
      </section>

      {/* ─── COMMUNITY PHOTO BANNER ─── */}
      <section className="mx-auto max-w-site px-4 md:px-8 mt-16">
        <div className="rounded-2xl overflow-hidden relative h-64 md:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80"
            alt="Library bookshelves stretching into the distance"
            className="object-cover w-full h-full"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/80 via-primary-dark/50 to-transparent" />
          <div className="absolute inset-0 flex items-center px-8 md:px-12">
            <div className="max-w-md">
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3">
                A historic home for learning
              </h2>
              <p className="text-sm md:text-base text-white/80 leading-relaxed mb-5">
                Housed in Commerce&apos;s beloved former Post Office since the 1890s, our library is the heart of the community.
              </p>
              <Link
                href="/about"
                className="inline-flex rounded-lg bg-white/20 border border-white/30 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-white hover:bg-white/30 transition-colors"
              >
                Our story &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOURS & LOCATION ─── */}
      <section className="mx-auto max-w-site px-4 md:px-8 mt-16 mb-16">
        <div className="mb-6">
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Visit Us
          </p>
          <h2 className="text-h2 text-gray-800">Hours & Location</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hours table */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Library Hours
            </h3>
            <div className="space-y-1.5">
              {LIBRARY_HOURS.map((h, i) => (
                <div
                  key={h.day}
                  className={`flex justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    i === mappedIndex
                      ? "bg-primary text-white font-medium shadow-sm"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{h.day}</span>
                  <span>
                    {h.closed ? "Closed" : `${h.open} – ${h.close}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
              <div className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {siteConfig.address}
                  </p>
                  <p className="text-xs text-gray-500">
                    Historic former Post Office — downtown Commerce
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                <a
                  href={`tel:${siteConfig.phone.replace(/[^\d]/g, "")}`}
                  className="text-sm text-primary hover:text-primary-mid transition-colors font-medium"
                >
                  {siteConfig.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="text-sm text-primary hover:text-primary-mid transition-colors"
                >
                  {siteConfig.email}
                </a>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden shadow-sm">
            <iframe
              src={siteConfig.googleMapsEmbed}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "400px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Commerce Public Library location map"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
