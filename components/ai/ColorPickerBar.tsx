"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CMSFieldType } from "@/lib/cms/schema";

interface ColorEntry {
  value: string | null;
  label: string;
  page: string;
  section: string;
  type: CMSFieldType;
  default?: string;
}

interface Props {
  /** Called after a color change is successfully saved */
  onColorSaved?: (page: string, section: string, color: string) => void;
}

export default function ColorPickerBar({ onColorSaved }: Props) {
  const [colors, setColors] = useState<Record<string, ColorEntry>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Fetch current color values on mount and after cms-published events
  const fetchColors = useCallback(async () => {
    try {
      const res = await fetch("/api/cms/colors?preview=true");
      if (!res.ok) return;
      const data = await res.json();
      setColors(data.colors || {});
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColors();
    const onPublish = () => setTimeout(fetchColors, 600);
    window.addEventListener("cms-published", onPublish);
    return () => window.removeEventListener("cms-published", onPublish);
  }, [fetchColors]);

  // Save a color change via the execute API (debounced 400ms)
  const saveColor = useCallback(
    (key: string, entry: ColorEntry, newColor: string) => {
      // Update local state immediately for instant swatch feedback
      setColors((prev) => ({
        ...prev,
        [key]: { ...entry, value: newColor },
      }));

      // Debounce the API call
      if (debounceRef.current[key]) clearTimeout(debounceRef.current[key]);
      debounceRef.current[key] = setTimeout(async () => {
        setSavingKey(key);
        try {
          const res = await fetch("/api/ai/admin/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toolName: "update_page_content",
              toolInput: { page: entry.page, section: entry.section, content: newColor },
            }),
          });
          if (res.ok) {
            window.dispatchEvent(new Event("cms-published"));
            onColorSaved?.(entry.page, entry.section, newColor);
          }
        } catch {
          // silent
        } finally {
          setSavingKey(null);
        }
      }, 400);
    },
    [onColorSaved]
  );

  // Reset a color to its default (empty string clears override)
  const resetColor = useCallback(
    async (key: string, entry: ColorEntry) => {
      setColors((prev) => ({
        ...prev,
        [key]: { ...entry, value: null },
      }));
      setSavingKey(key);
      try {
        const res = await fetch("/api/ai/admin/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolName: "update_page_content",
            toolInput: { page: entry.page, section: entry.section, content: "" },
          }),
        });
        if (res.ok) {
          window.dispatchEvent(new Event("cms-published"));
        }
      } catch {
        // silent
      } finally {
        setSavingKey(null);
      }
    },
    []
  );

  if (loading) return null;

  const entries = Object.entries(colors);
  if (entries.length === 0) return null;

  return (
    <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-2.5 py-1.5">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Label */}
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Colors</span>

        {entries.map(([key, entry]) => {
          const displayColor = entry.value || entry.default || "#cccccc";
          const isSaving = savingKey === key;
          const isGradient = entry.type === "gradient";

          return (
            <div key={key} className="flex items-center gap-1.5 group">
              {/* Color swatch + hidden input */}
              <label className="relative cursor-pointer" title={`${entry.label}: ${displayColor}`}>
                <span
                  className="block w-6 h-6 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200 transition-transform hover:scale-110"
                  style={{ background: displayColor }}
                />
                <input
                  type="color"
                  value={toHex(displayColor)}
                  onChange={(e) => saveColor(key, entry, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {isSaving && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-3 w-3 text-white drop-shadow" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  </span>
                )}
              </label>

              {/* Label */}
              <span className="text-[10px] font-medium text-gray-500">{entry.label}</span>

              {/* Reset button — only when a custom value is set */}
              {entry.value && (
                <button
                  onClick={() => resetColor(key, entry)}
                  className="hidden group-hover:flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                  title="Reset to default"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Gradient text input for non-simple colors */}
              {isGradient && entry.value && (
                <input
                  type="text"
                  value={entry.value}
                  onChange={(e) => saveColor(key, entry, e.target.value)}
                  className="w-28 text-[10px] font-mono bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30"
                  placeholder="CSS color or gradient"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Best-effort conversion to #hex for the native color input */
function toHex(color: string): string {
  if (!color) return "#cccccc";
  // Already hex
  if (/^#[0-9a-f]{6}$/i.test(color)) return color;
  if (/^#[0-9a-f]{3}$/i.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  // For gradients or named colors, fall back to a neutral
  if (color.includes("gradient") || color.includes("(")) return "#cccccc";
  // Try named color via canvas
  if (typeof document !== "undefined") {
    try {
      const ctx = document.createElement("canvas").getContext("2d");
      if (ctx) {
        ctx.fillStyle = color;
        return ctx.fillStyle; // returns #rrggbb
      }
    } catch {
      // fallback
    }
  }
  return "#cccccc";
}
