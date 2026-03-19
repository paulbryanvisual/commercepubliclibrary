/** Shared event types and placeholder data for Phase 2 */

export type Audience = "kids" | "teens" | "adults" | "seniors" | "all";

export interface LibraryEvent {
  slug: string;
  title: string;
  date: string;          // ISO date string e.g. "2026-03-21"
  startTime: string;     // e.g. "10:00 AM"
  endTime: string;       // e.g. "11:00 AM"
  description: string;
  longDescription: string;
  audience: Audience;
  recurring?: string;
  location: string;
  registrationRequired: boolean;
  spotsTotal?: number;
  spotsTaken?: number;
  image?: string;
  imageAlt?: string;
}

export const audienceConfig: Record<
  Audience,
  { bg: string; text: string; dot: string; label: string; border: string; hex: string }
> = {
  kids:    { bg: "bg-green-light",  text: "text-green-500",  dot: "bg-green-500",  border: "border-green-500",  label: "Kids",    hex: "#3B6D11" },
  teens:   { bg: "bg-purple-light", text: "text-purple",     dot: "bg-purple",     border: "border-purple",     label: "Teens",   hex: "#534AB7" },
  adults:  { bg: "bg-blue-light",   text: "text-blue",       dot: "bg-blue",       border: "border-blue",       label: "Adults",  hex: "#185FA5" },
  seniors: { bg: "bg-amber-light",  text: "text-amber",      dot: "bg-amber",      border: "border-amber",      label: "Seniors", hex: "#BA7517" },
  all:     { bg: "bg-gray-100",     text: "text-gray-600",   dot: "bg-gray-400",   border: "border-gray-400",   label: "All Ages", hex: "#73726c" },
};

export const sampleEvents: LibraryEvent[] = [
  {
    slug: "preschool-story-time",
    title: "Preschool Story Time",
    date: "2026-03-21",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    description: "Stories, songs, and crafts for ages 3-6. Parents welcome!",
    longDescription:
      "Join us every Saturday morning for our beloved Preschool Story Time! Each session features two picture books read aloud, a sing-along, and a simple craft activity that kids can take home. This program is designed for children ages 3-6, and a parent or caregiver must remain in the building during the program. No registration is needed — just drop in and enjoy!",
    audience: "kids",
    recurring: "Weekly on Saturdays",
    location: "Children's Room",
    registrationRequired: false,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop&q=80",
    imageAlt: "Colorful children's books stacked together",
  },
  {
    slug: "ged-tutoring",
    title: "GED Tutoring",
    date: "2026-03-18",
    startTime: "10:00 AM",
    endTime: "12:00 PM",
    description: "Free GED preparation with volunteer tutors. Drop in anytime.",
    longDescription:
      "Our volunteer tutors are here to help you prepare for the GED exam at your own pace. Whether you need help with math, science, social studies, or language arts, we have materials and one-on-one support available. Laptops with GED practice tests are provided. This is a drop-in program — come when you can and stay as long as you like. All materials are free.",
    audience: "adults",
    recurring: "Tuesdays & Thursdays",
    location: "Meeting Room A",
    registrationRequired: false,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop&q=80",
    imageAlt: "Student studying with notebook and pen",
  },
  {
    slug: "lego-club",
    title: "Lego Club",
    date: "2026-03-19",
    startTime: "3:30 PM",
    endTime: "4:30 PM",
    description: "Build, create, and imagine with our huge Lego collection. Ages 5-12.",
    longDescription:
      "Calling all builders! Lego Club is a weekly drop-in program where kids ages 5-12 can unleash their creativity with our massive Lego collection. Each week we announce an optional build challenge, but free building is always welcome. Creations are displayed in the library for one week. Parents may drop off children ages 8 and up; younger children need a caregiver in the building.",
    audience: "kids",
    recurring: "Weekly on Wednesdays",
    location: "Children's Room",
    registrationRequired: false,
    image: "https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=400&h=400&fit=crop&q=80",
    imageAlt: "Colorful Lego bricks for building and creating",
  },
  {
    slug: "adult-book-club",
    title: "Adult Book Club",
    date: "2026-03-20",
    startTime: "6:00 PM",
    endTime: "7:30 PM",
    description: "This month: 'The Women' by Kristin Hannah. New members welcome.",
    longDescription:
      "Join our monthly Adult Book Club for lively discussion and great company! This month we're reading 'The Women' by Kristin Hannah. Copies are available at the circulation desk — just ask for the Book Club pick. Light refreshments are provided. New members are always welcome; you don't need to have read the entire book to join the conversation. We meet on the third Thursday of each month.",
    audience: "adults",
    recurring: "Monthly — 3rd Thursday",
    location: "Meeting Room B",
    registrationRequired: true,
    spotsTotal: 20,
    spotsTaken: 14,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop&q=80",
    imageAlt: "Open book with reading glasses on a cozy table",
  },
  {
    slug: "teen-art-studio",
    title: "Teen Art Studio",
    date: "2026-03-21",
    startTime: "4:00 PM",
    endTime: "5:30 PM",
    description: "Mixed media art workshop for teens. All materials provided.",
    longDescription:
      "Teen Art Studio is a creative hangout for teens ages 12-18. Each week we explore a different art medium — watercolor, collage, printmaking, digital illustration, and more. All materials are provided, and no experience is necessary. This is a relaxed, judgment-free space to experiment with art and meet other creative teens. Finished pieces can be displayed in our Teen Art Gallery.",
    audience: "teens",
    recurring: "Weekly on Fridays",
    location: "Teen Space",
    registrationRequired: true,
    spotsTotal: 15,
    spotsTaken: 9,
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop&q=80",
    imageAlt: "Art supplies and creative materials on a table",
  },
  {
    slug: "esl-class",
    title: "ESL Class",
    date: "2026-03-18",
    startTime: "6:00 PM",
    endTime: "7:30 PM",
    description: "Free English as a Second Language class. All levels welcome.",
    longDescription:
      "Our ESL (English as a Second Language) classes welcome learners of all levels. Taught by certified volunteer instructors, these classes cover conversational English, reading, writing, and pronunciation. Childcare is available during class time — please let us know in advance if you need it. All materials are provided free of charge. Clase de ingles gratis — todos los niveles bienvenidos.",
    audience: "adults",
    recurring: "Tuesdays",
    location: "Meeting Room A",
    registrationRequired: true,
    spotsTotal: 25,
    spotsTaken: 18,
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=400&fit=crop&q=80",
    imageAlt: "Language learning materials and conversation",
  },
  {
    slug: "homeschool-art-studio",
    title: "Homeschool Art Studio",
    date: "2026-03-20",
    startTime: "1:00 PM",
    endTime: "2:30 PM",
    description: "Art projects for homeschool families. Ages 5-14.",
    longDescription:
      "Homeschool families are invited to join our bi-weekly Art Studio! Each session features an age-appropriate art project connected to a theme in art history, science, or literature. Children ages 5-14 are welcome, and projects are adaptable for different skill levels. A parent or caregiver must remain in the building. All materials are included.",
    audience: "kids",
    recurring: "Bi-weekly on Thursdays",
    location: "Meeting Room B",
    registrationRequired: true,
    spotsTotal: 20,
    spotsTaken: 12,
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=400&fit=crop&q=80",
    imageAlt: "Child painting with watercolors in art class",
  },
  {
    slug: "senior-tech-help",
    title: "Senior Tech Help",
    date: "2026-03-22",
    startTime: "11:00 AM",
    endTime: "1:00 PM",
    description: "One-on-one help with phones, tablets, email, and more.",
    longDescription:
      "Need help with your smartphone, tablet, or laptop? Our patient, friendly volunteers offer free one-on-one tech assistance for seniors. We can help with email, video calls, social media, online banking, downloading apps, and more. Bring your own device or use one of ours. Sessions are first-come, first-served and typically last 20-30 minutes.",
    audience: "seniors",
    recurring: "Monthly — 4th Sunday",
    location: "Computer Lab",
    registrationRequired: false,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop&q=80",
    imageAlt: "Senior person using a tablet device",
  },
  // Additional events to fill out the calendar
  {
    slug: "baby-rhyme-time",
    title: "Baby Rhyme Time",
    date: "2026-03-17",
    startTime: "9:30 AM",
    endTime: "10:00 AM",
    description: "Songs, rhymes, and bounces for babies 0-18 months and their caregivers.",
    longDescription:
      "Baby Rhyme Time is a 30-minute program of songs, rhymes, finger plays, and gentle bounces designed for babies from birth to 18 months and their caregivers. This early literacy program helps build language skills and bonding. A brief social time follows each session so caregivers can connect.",
    audience: "kids",
    recurring: "Weekly on Tuesdays",
    location: "Children's Room",
    registrationRequired: false,
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop&q=80",
    imageAlt: "Baby playing and learning with colorful toys",
  },
  {
    slug: "teen-game-night",
    title: "Teen Game Night",
    date: "2026-03-25",
    startTime: "5:00 PM",
    endTime: "7:00 PM",
    description: "Board games, video games, and snacks for teens ages 12-18.",
    longDescription:
      "Grab your friends and head to the library for Teen Game Night! We have board games, card games, a Nintendo Switch, and a PS5 set up for multiplayer fun. Snacks and drinks are provided. This is a fun, supervised hangout space just for teens ages 12-18.",
    audience: "teens",
    recurring: "Last Wednesday of the month",
    location: "Teen Space",
    registrationRequired: false,
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=400&fit=crop&q=80",
    imageAlt: "Video game controllers and board games",
  },
  {
    slug: "genealogy-workshop",
    title: "Genealogy Workshop",
    date: "2026-03-28",
    startTime: "2:00 PM",
    endTime: "4:00 PM",
    description: "Learn to research your family history using free online tools.",
    longDescription:
      "Discover your roots! This hands-on workshop teaches you how to research your family history using free resources like Ancestry Library Edition, FamilySearch, and local records. Whether you are just getting started or have been researching for years, our experienced volunteers can help you break through brick walls and find new connections. Bring any family documents or photos you have.",
    audience: "adults",
    recurring: "Last Saturday of the month",
    location: "Computer Lab",
    registrationRequired: true,
    spotsTotal: 12,
    spotsTaken: 7,
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&h=400&fit=crop&q=80",
    imageAlt: "Family tree and genealogy research documents",
  },
  {
    slug: "chess-club",
    title: "Chess Club",
    date: "2026-03-24",
    startTime: "4:00 PM",
    endTime: "5:30 PM",
    description: "Learn and play chess. All skill levels welcome, ages 8 and up.",
    longDescription:
      "Chess Club is open to players of all skill levels, ages 8 and up. Beginners can learn the basics from our experienced players, while advanced players can find challenging opponents. We provide all chess sets and boards. Casual play, puzzles, and occasional mini-tournaments keep things fun and engaging.",
    audience: "all",
    recurring: "Weekly on Tuesdays",
    location: "Meeting Room A",
    registrationRequired: false,
    image: "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=400&h=400&fit=crop&q=80",
    imageAlt: "Chess pieces on a wooden chess board",
  },
];

/** Get a single event by slug */
export function getEventBySlug(slug: string): LibraryEvent | undefined {
  return sampleEvents.find((e) => e.slug === slug);
}

/** Get events for a specific date (ISO string like "2026-03-21") */
export function getEventsByDate(date: string): LibraryEvent[] {
  return sampleEvents.filter((e) => e.date === date);
}

/** Get related events (same audience, excluding self) */
export function getRelatedEvents(event: LibraryEvent, limit = 3): LibraryEvent[] {
  return sampleEvents
    .filter((e) => e.slug !== event.slug && e.audience === event.audience)
    .slice(0, limit);
}

/**
 * Build a Google Calendar URL for an event.
 */
export function buildGoogleCalendarUrl(event: LibraryEvent): string {
  const parseTime = (dateStr: string, timeStr: string): Date => {
    const [time, meridiem] = timeStr.split(" ");
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (meridiem?.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (meridiem?.toUpperCase() === "AM" && hour === 12) hour = 0;
    const d = new Date(dateStr + "T00:00:00");
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const start = parseTime(event.date, event.startTime);
  const end = parseTime(event.date, event.endTime);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description,
    location: `${event.location}, Commerce Public Library, Commerce, TX`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an iCal (.ics) string for an event.
 */
export function buildIcsString(event: LibraryEvent): string {
  const parseTime = (dateStr: string, timeStr: string): Date => {
    const [time, meridiem] = timeStr.split(" ");
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (meridiem?.toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (meridiem?.toUpperCase() === "AM" && hour === 12) hour = 0;
    const d = new Date(dateStr + "T00:00:00");
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const start = parseTime(event.date, event.startTime);
  const end = parseTime(event.date, event.endTime);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Commerce Public Library//Events//EN",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/,/g, "\\,")}`,
    `LOCATION:${event.location}\\, Commerce Public Library\\, Commerce\\, TX`,
    `URL:https://commercepubliclibrary.org/events/${event.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
