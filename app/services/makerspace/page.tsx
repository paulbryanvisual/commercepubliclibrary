import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Maker Space | Commerce Public Library",
  description:
    "Create, build, and explore at the Commerce Public Library Maker Space. Access 3D printers, Cricut machines, crafting supplies, and more — free with your library card.",
};

const equipment = [
  {
    name: "3D Printer",
    description:
      "Bring your ideas to life! Print custom objects, prototypes, and models. Staff can help you get started with free design software.",
    icon: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
    color: "from-blue-500 to-indigo-600",
  },
  {
    name: "Cricut Maker",
    description:
      "Cut vinyl, paper, fabric, leather, and more with precision. Perfect for custom t-shirts, decals, signs, scrapbooking, and crafts.",
    icon: "M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z",
    color: "from-pink-500 to-rose-600",
  },
  {
    name: "Button Maker",
    description:
      "Design and press custom buttons and pins. Great for events, campaigns, parties, or just for fun.",
    icon: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z",
    color: "from-amber-500 to-orange-600",
  },
  {
    name: "Laminator",
    description:
      "Protect documents, photos, bookmarks, and craft projects with our professional laminator. Multiple sizes available.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "from-teal-500 to-emerald-600",
  },
  {
    name: "Crafting Supplies",
    description:
      "Scissors, paper, glue, markers, paint, yarn, fabric scraps, and a wide variety of crafting materials for any project.",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    color: "from-purple-500 to-violet-600",
  },
  {
    name: "Sewing Machine",
    description:
      "A beginner-friendly sewing machine available for in-library use. Perfect for mending, simple projects, or learning to sew.",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    color: "from-green-500 to-emerald-600",
  },
];

const programs = [
  {
    title: "Open Maker Hours",
    schedule: "Wednesdays & Fridays, 2:00 PM - 4:30 PM",
    description:
      "Drop in during open hours to use any of our maker equipment. Staff are available to help you get started.",
    audience: "All Ages",
  },
  {
    title: "Kids Maker Monday",
    schedule: "1st & 3rd Mondays, 3:30 PM - 4:30 PM",
    description:
      "Guided maker projects for ages 5-12. Each session has a fun theme — past projects include 3D printed keychains, vinyl stickers, and button badges.",
    audience: "Kids (5-12)",
  },
  {
    title: "Teen Maker Lab",
    schedule: "2nd & 4th Thursdays, 4:00 PM - 5:30 PM",
    description:
      "Teens get hands-on with 3D printing, Cricut design, and creative tech projects. Learn real-world skills in a fun, relaxed environment.",
    audience: "Teens (12-18)",
  },
  {
    title: "Adult Craft Night",
    schedule: "Last Tuesday of the month, 6:00 PM - 7:30 PM",
    description:
      "A social crafting evening for adults. Each month features a different project — Cricut vinyl designs, button making, or seasonal crafts. All materials provided.",
    audience: "Adults",
  },
];

const faqs = [
  {
    q: "Is the Maker Space free to use?",
    a: "Yes! All equipment and basic supplies are free with a valid Commerce Public Library card. Some specialty materials (like 3D printer filament for large projects) may have a small materials fee.",
  },
  {
    q: "Do I need to know how to use the equipment?",
    a: "Not at all! Staff and volunteers are always available during open hours to show you the ropes. We love helping beginners.",
  },
  {
    q: "Can I bring my own materials?",
    a: "Absolutely. You're welcome to bring your own vinyl, fabric, or other materials. We also have a good selection of supplies on hand.",
  },
  {
    q: "Do I need to make an appointment?",
    a: "Drop-ins are welcome during Open Maker Hours. For special programs, check the events calendar. Groups of 3 or more should call ahead.",
  },
  {
    q: "Can I use the Maker Space for a school project?",
    a: "Yes! Students are welcome. If you need help with a school project, our staff can assist with design and printing. Homeschool families are especially welcome.",
  },
];

export default function MakerspacePage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80"
          alt="Hands working with tools and technology in a maker space"
          className="w-full h-48 md:h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white border border-white/30">
              Free with Library Card
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Maker Space
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">
            Create, build, and explore with our hands-on tools and technology.
            3D printing, Cricut cutting, crafting, and more — all free.
          </p>
        </div>
      </div>

      {/* Equipment Grid */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Available Equipment
        </h2>
        <p className="text-gray-500 mb-8">
          Everything you need to bring your ideas to life.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {equipment.map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} mb-3`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                {item.name}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Maker Programs
        </h2>
        <p className="text-gray-500 mb-8">
          Guided sessions for all ages and skill levels. All materials provided.
        </p>
        <div className="space-y-4">
          {programs.map((prog) => (
            <div
              key={prog.title}
              className="flex flex-col sm:flex-row gap-4 rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-800">
                    {prog.title}
                  </h3>
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                    {prog.audience}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {prog.description}
                </p>
              </div>
              <div className="sm:w-56 shrink-0 flex items-center">
                <div className="flex items-center gap-2 text-sm text-[#1D9E75] font-medium">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {prog.schedule}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery placeholder */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Made at the Library
        </h2>
        <p className="text-gray-500 mb-6">
          Check out what our makers have been creating!
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { src: "https://images.unsplash.com/photo-1631733464449-c4cd4ad8f026?w=400&h=400&fit=crop&q=80", alt: "3D printed objects" },
            { src: "https://images.unsplash.com/photo-1452860606245-08b0a2b886a7?w=400&h=400&fit=crop&q=80", alt: "Cricut vinyl craft project" },
            { src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop&q=80", alt: "Art and crafting supplies" },
            { src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop&q=80", alt: "Creative maker project" },
          ].map((img, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
              <img src={img.src} alt={img.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-4 text-center">
          Share your creations! Tag us on{" "}
          <a href="https://facebook.com/CommercePL" target="_blank" rel="noopener noreferrer" className="text-[#1D9E75] hover:underline">
            Facebook
          </a>{" "}
          or{" "}
          <a href="https://instagram.com/commercepubliclibrary" target="_blank" rel="noopener noreferrer" className="text-[#1D9E75] hover:underline">
            Instagram
          </a>{" "}
          with #CommerceLibraryMakers
        </p>
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
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Make Something?</h2>
        <p className="text-white/80 mb-6 max-w-xl mx-auto">
          Drop by during Open Maker Hours or sign up for a guided program.
          All you need is your library card and an idea!
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/events"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#1D9E75] hover:bg-gray-50 transition-colors"
          >
            View Events Calendar
          </Link>
          <Link
            href="/get-card"
            className="rounded-xl border-2 border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Get a Library Card
          </Link>
        </div>
      </div>
    </div>
  );
}
