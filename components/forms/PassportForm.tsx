"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function PassportForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      date: (form.elements.namedItem("date") as HTMLInputElement).value,
      type: (form.elements.namedItem("type") as HTMLSelectElement).value,
      applicants: parseInt((form.elements.namedItem("applicants") as HTMLInputElement).value) || 1,
    };

    try {
      const res = await fetch("/api/forms/passport", {
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
        <h2 className="text-h3 text-gray-800 mb-2">Appointment Requested!</h2>
        <p className="text-sm text-gray-600">
          We&apos;ve sent a confirmation to your email. We&apos;ll confirm your appointment within 1 business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-primary-border bg-primary-light p-6 space-y-4">
      <h2 className="text-h3 text-gray-800 mb-3">Book an Appointment</h2>
      <p className="text-sm text-gray-600 mb-4">
        Fill out the form below to request a passport appointment. We will confirm via email within 1 business day.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input type="text" id="name" name="name" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" id="email" name="email" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" id="phone" name="phone" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Preferred Date *</label>
          <input type="date" id="date" name="date" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Application Type</label>
        <select id="type" name="type" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary">
          <option>New passport (first time)</option>
          <option>New passport (child under 16)</option>
          <option>Replacement (lost/stolen/damaged)</option>
          <option>Name change</option>
        </select>
      </div>

      <div>
        <label htmlFor="applicants" className="block text-sm font-medium text-gray-700 mb-1">Number of Applicants</label>
        <input type="number" id="applicants" name="applicants" min="1" max="6" defaultValue="1" className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-mid transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting..." : "Request Appointment"}
      </button>
    </form>
  );
}
