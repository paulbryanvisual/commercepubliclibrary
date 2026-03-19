import type { Metadata } from "next";
import Link from "next/link";
import RoomBookingForm from "@/components/forms/RoomBookingForm";

export const metadata: Metadata = {
  title: "Meeting Room Reservation",
  description:
    "Reserve a free meeting room at Commerce Public Library for your group, club, or organization.",
};

export default function RoomsPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      <nav className="text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
        <Link href="/services" className="hover:text-primary transition-colors">
          Services
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Meeting Room</span>
      </nav>

      <div className="max-w-3xl mb-12">
        <h1 className="text-h1 text-gray-800 mb-4">Meeting Room Reservation</h1>
        <p className="text-lg text-gray-500 leading-relaxed">
          Our meeting room is available free of charge for community groups,
          nonprofits, clubs, and organizations. Reserve your time online.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RoomBookingForm />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600 space-y-2">
            <h3 className="font-semibold text-gray-800">Room Info</h3>
            <p>&#x2022; Free of charge</p>
            <p>&#x2022; Seats up to ~30 people</p>
            <p>&#x2022; Available during library hours</p>
            <p>&#x2022; Tables & chairs provided</p>
            <p>&#x2022; WiFi available</p>
          </div>
          <div className="rounded-xl border border-amber-light bg-amber-light p-5 text-sm text-amber-text space-y-1.5">
            <h3 className="font-semibold text-amber-600">Guidelines</h3>
            <p>&#x2022; Rooms must be left clean</p>
            <p>&#x2022; No food or drink other than water</p>
            <p>&#x2022; Library policies apply</p>
          </div>
        </div>
      </div>
    </div>
  );
}
