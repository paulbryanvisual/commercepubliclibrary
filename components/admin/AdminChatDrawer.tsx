"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { PanelPosition } from "./AdminPreviewShell";

const AdminChat = dynamic(() => import("@/components/ai/AdminChat"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-2 text-gray-400">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  ),
});

interface Props {
  userId: string;
  userName: string;
  currentPage: string;
  position: PanelPosition;
  open: boolean;
  onToggle: () => void;
}

export default function AdminChatDrawer({
  userId,
  userName,
  currentPage,
  position,
  open,
  onToggle,
}: Props) {
  const router = useRouter();

  // Resizable size (px for left width, px for bottom height)
  const [leftWidth, setLeftWidth] = useState(420);
  const [bottomHeight, setBottomHeight] = useState(380);
  const isDraggingRef = useRef(false);
  const startRef = useRef(0);
  const startSizeRef = useRef(0);

  // Listen for CMS changes → refresh the page (no iframe needed!)
  useEffect(() => {
    const handler = () => {
      // Small delay to let the DB write settle, then refresh server components
      setTimeout(() => router.refresh(), 300);
    };
    window.addEventListener("cms-published", handler);
    return () => window.removeEventListener("cms-published", handler);
  }, [router]);

  // Resize handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startRef.current = position === "left" ? e.clientX : e.clientY;
      startSizeRef.current = position === "left" ? leftWidth : bottomHeight;
      document.body.style.cursor = position === "left" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [position, leftWidth, bottomHeight]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      if (position === "left") {
        const delta = e.clientX - startRef.current;
        setLeftWidth(Math.min(700, Math.max(320, startSizeRef.current + delta)));
      } else {
        const delta = startRef.current - e.clientY;
        setBottomHeight(Math.min(600, Math.max(250, startSizeRef.current + delta)));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [position]);

  // Panel classes based on position and open state
  const isLeft = position === "left";

  const panelStyle: React.CSSProperties = isLeft
    ? {
        position: "fixed",
        top: 40, // below toolbar
        left: 0,
        bottom: 0,
        width: leftWidth,
        zIndex: 40,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease-in-out",
      }
    : {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: bottomHeight,
        zIndex: 40,
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease-in-out",
      };

  // Resize handle
  const handleEl = isLeft ? (
    <div
      onMouseDown={handleMouseDown}
      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize bg-gray-200 hover:bg-purple/40 active:bg-purple/60 transition-colors flex items-center justify-center group z-10"
    >
      <div className="w-0.5 h-8 rounded-full bg-gray-400 group-hover:bg-purple transition-colors" />
    </div>
  ) : (
    <div
      onMouseDown={handleMouseDown}
      className="absolute top-0 left-0 right-0 h-1.5 cursor-row-resize bg-gray-200 hover:bg-purple/40 active:bg-purple/60 transition-colors flex items-center justify-center group z-10"
    >
      <div className="h-0.5 w-8 rounded-full bg-gray-400 group-hover:bg-purple transition-colors" />
    </div>
  );

  // Collapse tab (visible when panel is closed)
  const collapseTab = !open && (
    <button
      onClick={onToggle}
      className={`fixed z-40 bg-purple text-white shadow-lg hover:bg-purple-600 transition-all ${
        isLeft
          ? "top-1/2 -translate-y-1/2 left-0 rounded-r-xl px-1.5 py-4"
          : "bottom-0 left-1/2 -translate-x-1/2 rounded-t-xl px-4 py-1.5"
      }`}
      title="Open chat panel"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  );

  return (
    <>
      {collapseTab}
      <div style={panelStyle} className="bg-white border-gray-200 shadow-xl flex flex-col overflow-hidden border-r border-t">
        {handleEl}
        <div className={`flex flex-col flex-1 min-h-0 ${isLeft ? "pr-1.5" : "pt-1.5"}`}>
          <AdminChat userId={userId} userName={userName} currentPage={currentPage} />
        </div>
      </div>
    </>
  );
}
