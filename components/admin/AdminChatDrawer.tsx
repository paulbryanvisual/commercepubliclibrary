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

  // Resizable size — default thin
  const [leftWidth, setLeftWidth] = useState(300);
  const [bottomHeight, setBottomHeight] = useState(280);
  const isDraggingRef = useRef(false);
  const startRef = useRef(0);
  const startSizeRef = useRef(0);

  // Listen for CMS changes → refresh the page to show updated content
  useEffect(() => {
    const handler = () => {
      // Delay to let DB write settle, then re-fetch server component data
      setTimeout(() => {
        router.refresh();
      }, 500);
    };
    window.addEventListener("cms-published", handler);
    return () => window.removeEventListener("cms-published", handler);
  }, [router]);

  // Push page content aside when panel is open
  useEffect(() => {
    const isLeft = position === "left";
    if (open) {
      if (isLeft) {
        document.body.style.marginLeft = `${leftWidth}px`;
        document.body.style.marginBottom = "";
      } else {
        document.body.style.marginLeft = "";
        document.body.style.marginBottom = `${bottomHeight}px`;
      }
    } else {
      document.body.style.marginLeft = "";
      document.body.style.marginBottom = "";
    }
    // Smooth transition
    document.body.style.transition = "margin 0.3s ease-in-out";

    return () => {
      document.body.style.marginLeft = "";
      document.body.style.marginBottom = "";
      document.body.style.transition = "";
    };
  }, [open, position, leftWidth, bottomHeight]);

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
        setLeftWidth(Math.min(700, Math.max(280, startSizeRef.current + delta)));
      } else {
        const delta = startRef.current - e.clientY;
        setBottomHeight(Math.min(600, Math.max(200, startSizeRef.current + delta)));
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

  const isLeft = position === "left";

  const panelStyle: React.CSSProperties = isLeft
    ? {
        position: "fixed",
        top: 40,
        left: 0,
        bottom: 0,
        width: open ? leftWidth : 0,
        zIndex: 40,
        transition: "width 0.3s ease-in-out",
        overflow: "hidden",
      }
    : {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: open ? bottomHeight : 0,
        zIndex: 40,
        transition: "height 0.3s ease-in-out",
        overflow: "hidden",
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

  return (
    <div style={panelStyle} className="bg-white border-gray-200 shadow-xl flex flex-col border-r border-t">
      {handleEl}
      <div className={`flex flex-col flex-1 min-h-0 min-w-0 ${isLeft ? "pr-1.5" : "pt-1.5"}`}
        style={isLeft ? { minWidth: leftWidth } : { minHeight: bottomHeight }}
      >
        <AdminChat userId={userId} userName={userName} currentPage={currentPage} position={position} />
      </div>
    </div>
  );
}
