import type { Metadata } from "next";
import Link from "next/link";
import { PASSPORT_HOURS } from "@/lib/hours";
import PassportForm from "@/components/forms/PassportForm";

export const metadata: Metadata = {
  title: "Passport Services",
  description:
    "Commerce Public Library is an official U.S. passport acceptance facility. Book an appointment, view fees, and learn what to bring.",
};

const fees = [
  { item: "Acceptance/Processing fee", amount: "$35", note: "Paid to Commerce Public Library" },
  { item: "Passport photo", amount: "$12", note: "Taken on-site" },
  { item: "Passport book (adult)", amount: "$130", note: "Federal fee — paid to U.S. Department of State" },
  { item: "Passport card (adult)", amount: "$30", note: "Federal fee" },
  { item: "Passport book (under 16)", amount: "$100", note: "Federal fee" },
];

const checklist = [
  "Completed DS-11 form (do NOT sign until at the library)",
  "Proof of U.S. citizenship (birth certificate or naturalization certificate)",
  "Valid photo ID (driver's license, state ID, or military ID)",
  "Photocopy of front and back of ID",
  "Passport photo (or $12 for on-site photo)",
  "Payment: check or money order for federal fees; cash, check, or card for library fees",
];

export default function PassportPage() {
  return (
    <div className="mx-auto max-w-site px-4 md:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
        <Link href="/services" className="hover:text-primary transition-colors">
          Services
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">Passport Services</span>
      </nav>

      <div className="max-w-3xl mb-12">
        <span className="inline-block rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark mb-4">
          Official U.S. Passport Acceptance Facility
        </span>
        <h1 className="text-h1 text-gray-800 mb-4">Passport Services</h1>
        <p className="text-lg text-gray-500 leading-relaxed">
          Commerce Public Library processes new passport applications. Walk-ins
          accepted on a limited basis — appointments are strongly recommended.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Appointment booking */}
          <section>
            <PassportForm />
          </section>

          {/* What to bring */}
          <section>
            <h2 className="text-h3 text-gray-800 mb-3">What to Bring</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3">
              {checklist.map((item, i) => (
                <label key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  {item}
                </label>
              ))}
            </div>
          </section>

          {/* Fees */}
          <section>
            <h2 className="text-h3 text-gray-800 mb-3">Fees</h2>
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-700">
                      Item
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee, i) => (
                    <tr
                      key={fee.item}
                      className={i < fees.length - 1 ? "border-b border-gray-100" : ""}
                    >
                      <td className="px-4 py-3">
                        <span className="text-gray-700">{fee.item}</span>
                        <br />
                        <span className="text-xs text-gray-400">{fee.note}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {fee.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Important notes */}
          <section>
            <div className="rounded-xl border border-amber-light bg-amber-light p-6">
              <h3 className="text-sm font-semibold text-amber-600 mb-2">
                Important Notes
              </h3>
              <ul className="text-sm text-amber-text space-y-1.5">
                <li>&#x2022; We <strong>cannot</strong> process emergency/expedited passports</li>
                <li>&#x2022; We <strong>cannot</strong> process passport renewals by mail — those go directly to the State Department</li>
                <li>&#x2022; Both parents must be present for minors under 16, or provide notarized consent</li>
                <li>&#x2022; Processing times vary — check <a href="https://travel.state.gov" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber">travel.state.gov</a> for current wait times</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Passport hours */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Passport Hours
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Different from regular library hours
            </p>
            <div className="space-y-1.5">
              {PASSPORT_HOURS.map((h) => (
                <div
                  key={h.day}
                  className="flex justify-between text-sm text-gray-600"
                >
                  <span>{h.day.slice(0, 3)}</span>
                  <span>
                    {h.closed ? (
                      <span className="text-gray-400">Closed</span>
                    ) : (
                      `${h.open} – ${h.close}`
                    )}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Saturday hours: first Saturday of each month only
            </p>
          </div>

          {/* DS-11 form link */}
          <div className="rounded-xl border border-blue-100 bg-blue-light p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              DS-11 Form
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Download and fill out (but do NOT sign) before your appointment.
            </p>
            <a
              href="https://eforms.state.gov/Forms/ds11.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue hover:bg-blue-50 transition-colors"
            >
              Download DS-11 (PDF)
            </a>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">
              Questions?
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              Call us or email for passport questions.
            </p>
            <p className="text-sm">
              <a
                href="tel:9038866858"
                className="text-primary hover:text-primary-mid transition-colors"
              >
                (903) 886-6858
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
