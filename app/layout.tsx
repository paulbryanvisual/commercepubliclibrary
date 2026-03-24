import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Suspense } from "react";
import AdminPreviewShell from "@/components/admin/AdminPreviewShell";
import { getPublishedData } from "@/lib/cms/dataStore";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch global CMS settings for site-wide elements like the header color
  let headerBgColor: string | null = null;
  try {
    const cms = await getPublishedData();
    headerBgColor = cms.pageContent?.global?.header_bg_color || null;
  } catch {
    // Non-fatal — fall back to default color
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans text-gray-text bg-background antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <Header bgColor={headerBgColor} />
        <main id="main-content" role="main">
          {children}
        </main>
        <Footer />
        <Suspense><AdminPreviewShell /></Suspense>
      </body>
    </html>
  );
}
