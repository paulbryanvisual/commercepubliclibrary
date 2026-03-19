"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function RoomBookingForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = {
      organization: (form.elements.namedItem("org") as HTMLInputElement).value,
      contactName: (form.elements.namedItem("contact") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      date: (form.elements.namedItem("date") as HTMLInputElement).value,
      startTime: (form.elements.namedItem("start") as HTMLInputElement).value,
      endTime: (form.elements.namedItem("end") as HTMLInputElement).value,
      attendance: (form.elements.namedItem("attendance") as HTMLInputElement).value,
      purpose: (form.elements.namedItem("purpose") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/forms/room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Something went wrong");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-primary-border bg-primary-light p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-h3 text-gray-800 mb-2">Room Request Submitted!</h2>
        <p className="text-sm text-gray-600">
          We&apos;ve sent a confirmation to your email. We&apos;ll confirm availability within 1 business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <h2 className="text-h3 text-gray-800 mb-2">Request a Room</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="org" className="block text-sm font-medium text-gray-700 mb-1">Group / Organization Name *</label>
          <input type="text" id="org" name="org" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
          <input type="text" id="contact" name="contact" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="rm-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" id="rm-email" name="email" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label htmlFor="rm-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" id="rm-phone" name="phone" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="rm-date" className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input type="date" id="rm-date" name="date" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label htmlFor="rm-start" className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
          <input type="time" id="rm-start" name="start" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label htmlFor="rm-end" className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
          <input type="time" id="rm-end" name="end" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      <div>
        <label htmlFor="rm-attendance" className="block text-sm font-medium text-gray-700 mb-1">Expected Attendance</label>
        <input type="number" id="rm-attendance" name="attendance" min="1" max="50" className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
      </div>

      <div>
        <label htmlFor="rm-purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose of Meeting</label>
        <textarea id="rm-purpose" name="purpose" rows={3} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-mid transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting..." : "Submit Request"}
      </button>
      <p className="text-xs text-gray-400">
        You&apos;ll receive a confirmation email within 1 business day.
      </p>
    </form>
  );
}
