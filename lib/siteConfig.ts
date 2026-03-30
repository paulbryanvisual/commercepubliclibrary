// Central site configuration — will later pull from Sanity siteSettings
export const siteConfig = {
  name: "Commerce Public Library",
  tagline: "Your library. Your community.",
  description:
    "Free books, ebooks, events, and more — for everyone in Hunt County.",
  address: "1210 Park Street, Commerce, TX 75428",
  phone: "(903) 886-6858",
  email: "director@commercepubliclibrary.org",
  calendarEmail: "commercecalendars@gmail.com",
  url: "https://commercepubliclibrary.org",
  social: {
    facebook: "https://facebook.com/CommercePL",
    instagram: "https://instagram.com/commercepubliclibrary",
  },
  givebutter: "https://givebutter.com/CommercePL",
  catalogUrl: "https://commerce.booksys.net/opac/cpl/",
  journalArchive: "https://commerce.advantage-preservation.com",
  googleMapsEmbed:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3340.6!2d-95.9!3d33.25!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s1210+Park+Street+Commerce+TX+75428!5e0!3m2!1sen!2sus!4v1",
  nonprofit: {
    name: "Friends of the Commerce Public Library",
    type: "501(c)(3) nonprofit",
  },
} as const;

export interface NavLink {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

export const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/catalog", label: "Books & Media" },
  { href: "/events", label: "Events" },
  {
    href: "/services",
    label: "Services",
    children: [
      { href: "/services", label: "All Services" },
      { href: "/kids", label: "Kids" },
      { href: "/history", label: "History" },
      { href: "/services/passport", label: "Passports" },
      { href: "/services/rooms", label: "Meeting Rooms" },
    ],
  },
  { href: "/about", label: "About" },
];
