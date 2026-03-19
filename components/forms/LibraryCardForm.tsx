"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export default function LibraryCardForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem("first-name") as HTMLInputElement).value,
      lastName: (form.elements.namedItem("last-name") as HTMLInputElement).value,
      email: (form.elements.namedItem("card-email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("card-phone") as HTMLInputElement).value,
      address: (form.elements.namedItem("card-address") as HTMLInputElement).value,
      city: (form.elements.namedItem("city") as HTMLInputElement).value,
      state: (form.elements.namedItem("state") as HTMLInputElement).value,
      zip: (form.elements.namedItem("zip") as HTMLInputElement).value,
      dob: (form.elements.namedItem("card-dob") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/forms/library-card", {
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
      <div className="rounded-xl border border-primary-border bg-primary-light p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-h3 text-gray-800 mb-2">Application Received!</h2>
        <p className="text-sm text-gray-600 mb-4">
          Check your email for next steps. You can start using digital resources like Libby and Hoopla right away with your temporary card number.
        </p>
        <p className="text-xs text-gray-400">
          Pick up your physical card at the library or receive it by mail within 3 days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 space-y-5">
      <h2 className="text-h3 text-gray-800 mb-2">Library Card Application</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input type="text" id="first-name" name="first-name" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input type="text" id="last-name" name="last-name" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      <div>
        <label htmlFor="card-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
        <input type="email" id="card-email" name="card-email" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
      </div>

      <div>
        <label htmlFor="card-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input type="tel" id="card-phone" name="card-phone" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
      </div>

      <div>
        <label htmlFor="card-address" className="block text-sm font-medium text-gray-700 mb-1">Mailing Address *</label>
        <input type="text" id="card-address" name="card-address" required placeholder="Street address" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary mb-2" />
        <div className="grid grid-cols-3 gap-2">
          <input type="text" name="city" placeholder="City" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          <input type="text" name="state" placeholder="State" defaultValue="TX" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
          <input type="text" name="zip" placeholder="ZIP" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </div>
      </div>

      <div>
        <label htmlFor="card-dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
        <input type="date" id="card-dob" name="card-dob" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary max-w-xs" />
      </div>

      <div className="flex items-start gap-3">
        <input type="checkbox" id="card-terms" required className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
        <label htmlFor="card-terms" className="text-sm text-gray-600">
          I agree to follow the library&apos;s{" "}
          <a href="/about#privacy" className="text-primary underline">patron guidelines and policies</a>.
          I understand that I am responsible for all materials checked out on my card. *
        </label>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-mid transition-colors disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
