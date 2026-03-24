"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy-load the heavy components
const AdminChatDrawer = dynamic(() => import("./AdminChatDrawer"), { ssr: false });
const AIChatButton = dynamic(() => import("@/components/ai/AIChatButton"), { ssr: false });
const InlineEditorOverlay = dynamic(() => import("./InlineEditorOverlay"), { ssr: false });

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export type PanelPosition = "left" | "bottom";

/**
 * AdminPreviewShell — lives in root layout.
 * If admin is logged in + preview mode: shows chat drawer + preview toolbar.
 * Otherwise: shows the normal patron AIChatButton.
 */
export default function AdminPreviewShell() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>("left");
  const [panelOpen, setPanelOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const isPreview = searchParams.get("preview") === "true";

  // Check admin session on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/admin-session", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setAdminUser(data.user);
        }
      } catch {
        // Not logged in
      } finally {
        setChecked(true);
      }
    })();
  }, []);

  // Restore panel position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cpl-admin-panel-pos");
    if (saved === "left" || saved === "bottom") setPanelPosition(saved);
  }, []);

  const handleSetPosition = useCallback((pos: PanelPosition) => {
    setPanelPosition(pos);
    localStorage.setItem("cpl-admin-panel-pos", pos);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/admin-session", { method: "DELETE" });
    } catch {
      // Best effort
    }
    setAdminUser(null);
    // Strip preview param and go home
    router.push("/");
  }, [router]);

  // Add/remove preview-mode class on body
  useEffect(() => {
    if (adminUser && isPreview) {
      document.body.classList.add("preview-mode");
      return () => { document.body.classList.remove("preview-mode"); };
    }
  }, [adminUser, isPreview]);

  // Not yet checked — render nothing
  if (!checked) return null;

  // Not an admin or not in preview mode — show normal patron chat
  if (!adminUser || !isPreview) {
    return <AIChatButton />;
  }

  // Admin in preview mode — show the drawer + toolbar
  return (
    <>
      {/* Inline text editor — click any marked element to edit in place */}
      <InlineEditorOverlay />

      {/* Preview mode toolbar */}
      <PreviewToolbar
        user={adminUser}
        panelPosition={panelPosition}
        onSetPosition={handleSetPosition}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((p) => !p)}
        onLogout={handleLogout}
      />

      {/* Chat drawer */}
      <AdminChatDrawer
        userId={adminUser.id}
        userName={adminUser.displayName}
        currentPage={pathname}
        position={panelPosition}
        open={panelOpen}
        onToggle={() => setPanelOpen((p) => !p)}
      />
    </>
  );
}

/* ── Preview Toolbar ── */
function PreviewToolbar({
  user,
  panelPosition,
  onSetPosition,
  panelOpen,
  onTogglePanel,
  onLogout,
}: {
  user: AdminUser;
  panelPosition: PanelPosition;
  onSetPosition: (pos: PanelPosition) => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  // Live page URL = current path without ?preview=true
  const liveUrl = pathname === "/" ? "/" : pathname;

  return (
    <div className="fixed top-0 left-0 right-0 h-10 z-50 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 gap-3">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Toggle chat panel */}
        <button
          onClick={onTogglePanel}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
            panelOpen
              ? "bg-purple-light text-purple"
              : "text-gray-500 hover:bg-gray-100"
          }`}
          title={panelOpen ? "Hide chat panel" : "Show chat panel"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {panelOpen ? "Hide Chat" : "Show Chat"}
        </button>

        <div className="h-4 w-px bg-gray-200" />

        {/* Preview mode badge */}
        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-semibold text-amber-700">EDITING</span>
        </div>

        <div className="h-4 w-px bg-gray-200" />

        {/* Panel position toggle */}
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => onSetPosition("left")}
            className={`rounded-md p-1 transition-colors ${
              panelPosition === "left"
                ? "bg-white text-purple shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Drawer (left side)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
          <button
            onClick={() => onSetPosition("bottom")}
            className={`rounded-md p-1 transition-colors ${
              panelPosition === "bottom"
                ? "bg-white text-purple shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Panel (bottom)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-purple-light px-2.5 py-0.5">
          <div className="h-4 w-4 rounded-full bg-purple flex items-center justify-center">
            <span className="text-[8px] font-bold text-white uppercase">
              {user.displayName.charAt(0)}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-purple">
            {user.displayName}
          </span>
        </div>
        <a
          href={liveUrl}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          View Live
        </a>
        <button
          onClick={onLogout}
          className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
