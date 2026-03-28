"use client";

import { useState, useRef, useEffect } from "react";
import { usePatron } from "./PatronContext";
import Link from "next/link";

export default function PatronLoginModal() {
  const { showLoginModal, setShowLoginModal, login, isLoggingIn, error } = usePatron();
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showLoginModal) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setCardNumber("");
      setPin("");
      setShowHelp(false);
    }
  }, [showLoginModal]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (showLoginModal) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [showLoginModal]);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !pin) return;
    await login(cardNumber, pin);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setShowLoginModal(false)}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#114d3e] to-[#1D9E75] px-6 pt-8 pb-6 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-lg shadow-black/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M7 8h2M7 12h10M7 16h6" />
              <circle cx="17" cy="8" r="1.5" fill="white" stroke="none" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Welcome Back</h2>
          <p className="text-sm text-white/70 mt-1">
            Sign in with your library card
          </p>

          {/* Close button */}
          <button
            onClick={() => setShowLoginModal(false)}
            className="absolute top-4 right-4 rounded-full p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
                <button
                  type="button"
                  onClick={() => setShowHelp(true)}
                  className="text-xs text-red-600 underline mt-1"
                >
                  Need help signing in?
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="modal-card" className="block text-sm font-medium text-gray-700 mb-1.5">
              Library Card Number
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                id="modal-card"
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Enter your library card barcode"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-white transition-all"
                autoComplete="username"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M7 8h2M7 12h10M7 16h6" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="modal-pin" className="block text-sm font-medium text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="modal-pin"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 focus:bg-white transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || !cardNumber || !pin}
            className="w-full rounded-xl bg-[#1D9E75] py-3.5 text-sm font-semibold text-white hover:bg-[#178a65] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-[#1D9E75]/25"
          >
            {isLoggingIn ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {/* Help section */}
          {showHelp && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 space-y-2">
              <p className="text-sm font-medium text-amber-900">Having trouble?</p>
              <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                <li>Your card number is the barcode on the back of your library card</li>
                <li>Your password was set when you created your online account</li>
                <li>If you&apos;ve never logged in, ask the front desk for your password</li>
              </ul>
              <p className="text-xs text-amber-700 pt-1">
                Still stuck? Call us at{" "}
                <a href="tel:9038866858" className="font-medium underline">(903) 886-6858</a>
              </p>
            </div>
          )}

          {!showHelp && (
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Need help signing in?
            </button>
          )}

          <div className="pt-2 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400">
              Don&apos;t have a library card?{" "}
              <Link
                href="/get-card"
                className="text-[#1D9E75] font-medium hover:underline"
                onClick={() => setShowLoginModal(false)}
              >
                Get one free →
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
