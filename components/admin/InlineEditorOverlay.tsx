"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ActiveEdit {
  el: HTMLElement;
  page: string;
  section: string;
  original: string;
}

interface SaveState {
  status: "idle" | "saving" | "saved" | "error";
  message?: string;
}

/**
 * InlineEditorOverlay
 *
 * When mounted (admin preview mode), this component:
 * 1. Finds all elements with [data-cms-editable] and adds highlight-on-hover styling
 * 2. On click → makes the element contenteditable and shows a floating Save/Publish bar
 * 3. Save Draft → saves to draft_content via the execute API
 * 4. Publish → saves draft then immediately publishes to live
 * 5. Cancel → restores original text
 */
export default function InlineEditorOverlay() {
  const router = useRouter();
  const [activeEdit, setActiveEdit] = useState<ActiveEdit | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  /* ── Apply hover/click styles to all [data-cms-editable] elements ── */
  const attachHandlers = useCallback(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-cms-editable]");
    els.forEach((el) => {
      if (el.dataset.inlineHandled) return; // already attached
      el.dataset.inlineHandled = "true";

      el.addEventListener("mouseenter", () => {
        if (!el.isContentEditable) el.classList.add("cms-editable-hover");
      });
      el.addEventListener("mouseleave", () => {
        el.classList.remove("cms-editable-hover");
      });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        activateEdit(el);
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Watch for DOM changes (e.g. after router.refresh) ── */
  useEffect(() => {
    attachHandlers();

    observerRef.current = new MutationObserver(() => attachHandlers());
    observerRef.current.observe(document.body, { childList: true, subtree: true });

    // Re-attach after CMS publishes (page refreshes)
    const onPublish = () => setTimeout(attachHandlers, 600);
    window.addEventListener("cms-published", onPublish);

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("cms-published", onPublish);
      // Clean up any open edit
      document.querySelectorAll<HTMLElement>("[data-cms-editable]").forEach((el) => {
        el.removeAttribute("contenteditable");
        el.classList.remove("cms-editable-hover", "cms-editable-active");
        delete el.dataset.inlineHandled;
      });
    };
  }, [attachHandlers]);

  /* ── Activate editing on a specific element ── */
  const activateEdit = useCallback((el: HTMLElement) => {
    // Cancel any existing edit first
    if (activeEdit && activeEdit.el !== el) {
      deactivate(activeEdit);
    }

    const page = el.dataset.cmsPage || "";
    const section = el.dataset.cmsSection || "";
    const original = el.innerText;

    el.contentEditable = "true";
    el.spellcheck = true;
    el.classList.remove("cms-editable-hover");
    el.classList.add("cms-editable-active");
    el.focus();

    // Move caret to end
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(el);
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);

    setActiveEdit({ el, page, section, original });
    setSaveState({ status: "idle" });
    positionToolbar(el);
  }, [activeEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Position floating toolbar above/below the edited element ── */
  const positionToolbar = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const toolbarHeight = 44;
    const margin = 8;
    const spaceAbove = rect.top;
    const top = spaceAbove > toolbarHeight + margin
      ? rect.top - toolbarHeight - margin
      : rect.bottom + margin;
    setToolbarPos({ top, left: rect.left });
  };

  /* ── Deactivate editing ── */
  const deactivate = useCallback((edit: ActiveEdit) => {
    edit.el.removeAttribute("contenteditable");
    edit.el.classList.remove("cms-editable-active", "cms-editable-hover");
  }, []);

  /* ── Handle Cancel ── */
  const handleCancel = useCallback(() => {
    if (!activeEdit) return;
    activeEdit.el.innerText = activeEdit.original;
    deactivate(activeEdit);
    setActiveEdit(null);
    setSaveState({ status: "idle" });
  }, [activeEdit, deactivate]);

  /* ── Save to draft via execute API ── */
  const saveDraft = useCallback(async (): Promise<{ table: string; id: string } | null> => {
    if (!activeEdit) return null;
    const content = activeEdit.el.innerText.trim();
    if (!content) return null;

    setSaveState({ status: "saving" });
    try {
      const res = await fetch("/api/ai/admin/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolName: "update_page_content",
          toolInput: { page: activeEdit.page, section: activeEdit.section, content },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed");
      setSaveState({ status: "saved", message: "Draft saved" });
      window.dispatchEvent(new Event("cms-published")); // refresh preview
      return data.draft || null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setSaveState({ status: "error", message: msg });
      return null;
    }
  }, [activeEdit]);

  /* ── Handle Save Draft ── */
  const handleSaveDraft = useCallback(async () => {
    const draft = await saveDraft();
    if (draft) {
      deactivate(activeEdit!);
      setActiveEdit(null);
    }
  }, [saveDraft, activeEdit, deactivate]);

  /* ── Handle Publish ── */
  const handlePublish = useCallback(async () => {
    const draft = await saveDraft();
    if (!draft) return;

    setSaveState({ status: "saving" });
    try {
      const res = await fetch("/api/cms/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", table: draft.table, id: draft.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Publish failed");
      setSaveState({ status: "saved", message: "Published ✓" });
      window.dispatchEvent(new Event("cms-published"));
      deactivate(activeEdit!);
      setActiveEdit(null);
      setTimeout(() => router.refresh(), 400);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Publish failed";
      setSaveState({ status: "error", message: msg });
    }
  }, [saveDraft, activeEdit, deactivate, router]);

  /* ── Reposition toolbar on scroll/resize ── */
  useEffect(() => {
    if (!activeEdit) return;
    const reposition = () => positionToolbar(activeEdit.el);
    window.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition);
      window.removeEventListener("resize", reposition);
    };
  }, [activeEdit]);

  /* ── Keyboard shortcuts while editing ── */
  useEffect(() => {
    if (!activeEdit) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); handleCancel(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handlePublish(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); handleSaveDraft(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeEdit, handleCancel, handlePublish, handleSaveDraft]);

  /* ── Global styles injected once ── */
  useEffect(() => {
    const id = "cms-inline-edit-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      [data-cms-editable].cms-editable-hover {
        outline: 2px dashed rgba(83, 74, 183, 0.5) !important;
        outline-offset: 3px;
        border-radius: 3px;
        cursor: text;
      }
      [data-cms-editable].cms-editable-active {
        outline: 2px solid rgba(83, 74, 183, 0.9) !important;
        outline-offset: 3px;
        border-radius: 3px;
        background: rgba(83, 74, 183, 0.06);
        min-width: 20px;
        min-height: 1em;
      }
      [data-cms-editable][contenteditable] {
        caret-color: rgba(83, 74, 183, 1);
        white-space: pre-wrap;
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (!activeEdit) return null;

  const isSaving = saveState.status === "saving";

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[9990] flex items-center gap-1.5 rounded-xl bg-white shadow-xl border border-gray-200 px-2.5 py-1.5 select-none"
      style={{ top: toolbarPos.top, left: Math.max(8, toolbarPos.left) }}
      onMouseDown={(e) => e.preventDefault()} // prevent blur on toolbar click
    >
      {/* Section label */}
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mr-1">
        {activeEdit.section.replace(/_/g, " ")}
      </span>
      <div className="w-px h-4 bg-gray-200" />

      {/* Save draft */}
      <button
        onClick={handleSaveDraft}
        disabled={isSaving}
        className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
        title="Save as draft (⌘S)"
      >
        {isSaving ? (
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        )}
        Draft
      </button>

      {/* Publish */}
      <button
        onClick={handlePublish}
        disabled={isSaving}
        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
        title="Publish to live site (⌘↵)"
      >
        {isSaving ? (
          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
          </svg>
        )}
        Publish
      </button>

      {/* Status message */}
      {saveState.status === "saved" && (
        <span className="text-[10px] font-semibold text-green-600">{saveState.message}</span>
      )}
      {saveState.status === "error" && (
        <span className="text-[10px] font-semibold text-red-500">{saveState.message}</span>
      )}

      {/* Cancel */}
      <button
        onClick={handleCancel}
        className="ml-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        title="Cancel (Esc)"
      >
        ✕
      </button>
    </div>
  );
}
