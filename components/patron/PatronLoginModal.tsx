"use client";

import { useState, useRef, useEffect } from "react";
import { usePatron } from "./PatronContext";
import Link from "next/link";

export default function PatronLoginModal() {
  const { showLoginModal, setShowLoginModal, login, isLoggingIn, error } = usePatron();
  const [cardNumber, setCardNumber] = useState("");
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showLoginModal) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showLoginModal]);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !pin) return;
    await login(cardNumber, pin);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setShowLoginModal(false)}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark to-primary p-6 text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-white">Sign In to Your Account</h2>
          <p className="text-sm text-white/70 mt-1">
            Use your library card number and PIN
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="modal-card" className="block text-sm font-medium text-gray-700 mb-1">
              Library Card Number
            </label>
            <input
              ref={inputRef}
              type="text"
              id="modal-card"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="Enter your card barcode"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="modal-pin" className="block text-sm font-medium text-gray-700 mb-1">
              PIN
            </label>
            <input
              type="password"
              id="modal-pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your PIN"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || !cardNumber || !pin}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-mid transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          <p className="text-center text-xs text-gray-400">
            Don&apos;t have a card?{" "}
            <Link
              href="/get-card"
              className="text-primary underline"
              onClick={() => setShowLoginModal(false)}
            >
              Get one free
            </Link>
          </p>
        </form>

        {/* Close button */}
        <button
          onClick={() => setShowLoginModal(false)}
          className="absolute top-4 right-4 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30 transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
