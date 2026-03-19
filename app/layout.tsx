import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AIChatButton from "@/components/ai/AIChatButton";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Commerce Public Library — Commerce, TX",
    template: "%s | Commerce Public Library",
  },
  description:
    "Free books, ebooks, events, passport services, and more — for everyone in Hunt County. Located in historic downtown Commerce, Texas.",
  keywords: [
    "Commerce Public Library",
    "Commerce Texas",
    "Hunt County library",
    "free library",
    "passport services",
    "ebooks",
    "community events",
  ],
  openGraph: {
    title: "Commerce Public Library",
    description:
      "Your library. Your community. Free books, ebooks, events, and more — for everyone in Hunt County.",
    url: "https://commercepubliclibrary.org",
    siteName: "Commerce Public Library",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans text-gray-text bg-background antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <Header />
        <main id="main-content" role="main">
          {children}
        </main>
        <Footer />
        <AIChatButton />
      </body>
    </html>
  );
}
