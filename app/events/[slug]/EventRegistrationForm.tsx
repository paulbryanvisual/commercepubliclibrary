"use client";

import { useState, type FormEvent } from "react";

interface EventRegistrationFormProps {
  eventTitle: string;
  eventSlug: string;
}

export default function EventRegistrationForm({
  eventTitle,
  eventSlug,
}: EventRegistrationFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      // In production this would POST to an API route
      console.log("Registration submitted:", { eventSlug, name, email, phone });
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-light p-6 text-center animate-fade-in">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">
          You&apos;re registered!
        </h3>
        <p className="text-sm text-gray-500">
          We&apos;ll send a confirmation to <strong className="text-gray-700">{email}</strong>.
          See you at <em>{eventTitle}</em>!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-1">Register for This Event</h3>
      <p className="text-xs text-gray-400 mb-5">
        All fields are required. Registration is free.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reg-name" className="block text-xs font-semibold text-gray-600 mb-1">
            Full Name
          </label>
          <input
            id="reg-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all"
          />
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-600 mb-1">
            Email Address
          </label>
          <input
            id="reg-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all"
          />
        </div>

        <div>
          <label htmlFor="reg-phone" className="block text-xs font-semibold text-gray-600 mb-1">
            Phone Number
          </label>
          <input
            id="reg-phone"
            type="tel"
            required
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(903) 555-0123"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Registering...
            </span>
          ) : (
            "Register Now"
          )}
        </button>

        <p className="text-[11px] text-gray-400 text-center">
          By registering you agree to receive an email confirmation.
          We will never share your information.
        </p>
      </form>
    </div>
  );
}
