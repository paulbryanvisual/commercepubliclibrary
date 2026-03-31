"use client";

import { useState } from "react";
import Link from "next/link";

const ageGroups = [
  {
    name: "Early Literacy",
    ages: "Ages 0-5",
    color: "from-pink-400 to-rose-500",
    bgColor: "bg-pink-50 border-pink-200",
    goals: ["Read 20 minutes a day with a caregiver", "Complete 5 activity sheets", "Attend 3 story times"],
    prizes: ["Summer reading t-shirt", "Book of your choice", "Sticker collection"],
    activities: [
      "Weekly Story Time with crafts",
      "Dino Discovery sensory play",
      "Outdoor nature walk & story",
      "Puppet show finale party",
    ],
  },
  {
    name: "Kids",
    ages: "Ages 6-11",
    color: "from-emerald-400 to-green-500",
    bgColor: "bg-green-50 border-green-200",
    goals: ["Read 10 books (or 600 pages)", "Complete 3 maker challenges", "Attend 4 programs"],
    prizes: ["Summer reading medal", "Book of your choice", "Pizza party invitation", "Maker Space free project"],
    activities: [
      "Fossil dig & paleontology workshop",
      "Lego build challenge: Dino Edition",
      "Homeschool Art Studio: Cave paintings",
      "Movie afternoon: Jurassic World",
      "End-of-summer pool party (at city pool)",
    ],
  },
  {
    name: "Teens",
    ages: "Ages 12-18",
    color: "from-violet-500 to-purple-600",
    bgColor: "bg-purple-50 border-purple-200",
    goals: ["Read 5 books (any format)", "Write 2 reviews", "Complete 2 volunteer hours"],
    prizes: ["Gift card drawing entry", "Exclusive library tote bag", "Community service hours certificate"],
    activities: [
      "Escape Room: Museum Heist",
      "Teen Maker Lab: 3D print a fossil",
      "Book vs. Movie debate night",
      "Gaming tournament",
      "Volunteer as a Reading Buddy",
    ],
  },
  {
    name: "Adults",
    ages: "18+",
    color: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-50 border-amber-200",
    goals: ["Read 4 books", "Try 1 new genre", "Attend 1 program"],
    prizes: ["Prize drawing entries", "Library tote bag", "Local business coupons"],
    activities: [
      "Adult Book Club: summer picks",
      "Genealogy workshop: dig into your roots",
      "Author talk (virtual)",
      "Craft night: fossil imprint art",
    ],
  },
];

const timeline = [
  { date: "April 1", event: "Registration opens on Beanstack", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { date: "June 1", event: "Summer Reading Program begins!", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
  { date: "June - July", event: "Weekly programs, challenges & events", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { date: "July 31", event: "Last day to log reading", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { date: "August 2", event: "Grand Finale party & prize giveaway!", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
];

export default function SummerReadingPage() {
  const [selectedAge, setSelectedAge] = useState(0);
  const group = ageGroups[selectedAge];

  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&q=80"
          alt="Children reading outdoors in summer sunshine"
          className="w-full h-56 md:h-80 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold text-amber-900">
              Summer 2026
            </span>
            <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white border border-white/30">
              All Ages
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
            Unearth a Story
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">
            Dig into reading this summer! Explore paleontology, archaeology, genealogy,
            and hidden stories. Free for all ages — prizes, programs, and fun all summer long.
          </p>
          <p className="text-sm text-white/60 mt-3">
            Part of the Collaborative Summer Library Program (CSLP) &middot; June 1 - July 31, 2026
          </p>
        </div>
      </div>

      {/* How it works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">How It Works</h2>
        <p className="text-gray-500 mb-8">Three simple steps to join the fun.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Sign Up",
              desc: "Register on Beanstack starting April 1. Download the Beanstack app or sign up at the library. It's free!",
              gradient: "from-emerald-400 to-teal-500",
            },
            {
              step: "2",
              title: "Read & Explore",
              desc: "Log your reading on Beanstack, attend programs, and complete fun challenges. Read anything — books, ebooks, audiobooks, magazines.",
              gradient: "from-amber-400 to-orange-500",
            },
            {
              step: "3",
              title: "Earn Prizes",
              desc: "Hit milestones to unlock prizes. Complete the program to earn your Summer Reading medal and be entered into grand prize drawings!",
              gradient: "from-rose-400 to-pink-500",
            },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-gray-200 bg-white p-6 text-center">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} text-white text-xl font-bold mb-4`}>
                {s.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Age group tabs */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Programs by Age Group
        </h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {ageGroups.map((g, i) => (
            <button
              key={g.name}
              onClick={() => setSelectedAge(i)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                selectedAge === i
                  ? `bg-gradient-to-r ${g.color} text-white shadow-lg`
                  : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {g.name}
              <span className="ml-1.5 text-xs opacity-80">{g.ages}</span>
            </button>
          ))}
        </div>

        <div className={`rounded-2xl border p-6 md:p-8 ${group.bgColor}`}>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Goals */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                Reading Goals
              </h3>
              <ul className="space-y-2">
                {group.goals.map((goal, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" className="mt-0.5 shrink-0">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {goal}
                  </li>
                ))}
              </ul>
            </div>

            {/* Activities */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                Activities & Events
              </h3>
              <ul className="space-y-2">
                {group.activities.map((act, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-amber-500 mt-0.5">&#9733;</span>
                    {act}
                  </li>
                ))}
              </ul>
            </div>

            {/* Prizes */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                Prizes
              </h3>
              <ul className="space-y-2">
                {group.prizes.map((prize, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-rose-500 mt-0.5">&#127873;</span>
                    {prize}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">
          Summer Timeline
        </h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200 md:left-1/2" />

          <div className="space-y-6">
            {timeline.map((item, i) => (
              <div key={i} className="relative flex items-start gap-4 md:gap-0">
                {/* Dot */}
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white border-2 border-[#1D9E75] md:absolute md:left-1/2 md:-translate-x-1/2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                </div>

                {/* Content */}
                <div className={`flex-1 rounded-xl border border-gray-200 bg-white p-4 ${
                  i % 2 === 0 ? "md:mr-[55%]" : "md:ml-[55%]"
                }`}>
                  <p className="text-sm font-bold text-[#1D9E75] mb-0.5">{item.date}</p>
                  <p className="text-sm text-gray-700">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sponsors / Partners */}
      <section className="mb-12 rounded-xl border border-gray-200 bg-white p-6 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
          Made possible by
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <span className="text-sm font-medium text-gray-500">Collaborative Summer Library Program (CSLP)</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-medium text-gray-500">Texas State Library</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-medium text-gray-500">Friends of the Commerce Public Library</span>
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 p-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Ready to Unearth a Story?
        </h2>
        <p className="text-white/80 mb-6 max-w-xl mx-auto">
          Registration opens April 1. The first 50 people to sign up get a summer reading goody bag!
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/get-card"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Get a Library Card
          </Link>
          <Link
            href="/events"
            className="rounded-xl border-2 border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            View Events Calendar
          </Link>
        </div>
        <p className="text-white/60 text-xs mt-4">
          Follow us on{" "}
          <a href="https://facebook.com/CommercePL" target="_blank" rel="noopener noreferrer" className="text-white underline">
            Facebook
          </a>{" "}
          and{" "}
          <a href="https://instagram.com/commercepubliclibrary" target="_blank" rel="noopener noreferrer" className="text-white underline">
            Instagram
          </a>{" "}
          for updates!
        </p>
      </div>
    </div>
  );
}
