"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent, type DragEvent } from "react";
import { createPortal } from "react-dom";
import ColorPickerBar from "./ColorPickerBar";

/* ── True screenshot via getDisplayMedia ── */

// Module-level stream cache so we only ask for permission once per session
let _captureStream: MediaStream | null = null;

async function getTabStream(): Promise<MediaStream | null> {
  // Reuse live stream if we already have one
  if (_captureStream && _captureStream.active) return _captureStream;
  _captureStream = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const constraints: any = {
      video: { displaySurface: "browser", frameRate: 5 },
      audio: false,
      preferCurrentTab: true,   // Chrome 107+ — auto-selects current tab
      selfBrowserSurface: "include",
      systemAudio: "exclude",
    };
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    // Auto-clear when the user stops sharing
    stream.getVideoTracks()[0].addEventListener("ended", () => { _captureStream = null; });
    _captureStream = stream;
    return stream;
  } catch {
    return null; // User cancelled or browser doesn't support it
  }
}

/** Capture a frame from the tab stream, optionally cropped to a viewport rect */
async function captureFrame(
  crop?: { x: number; y: number; w: number; h: number }
): Promise<{ base64: string; mediaType: string; fileName: string; dataUrl: string } | null> {
  if (typeof window === "undefined") return null;

  const stream = await getTabStream();
  if (!stream) return null;

  const track = stream.getVideoTracks()[0];

  // Prefer ImageCapture API (cleaner, no <video> flicker) when available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (window as any).ImageCapture !== "undefined") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ic = new (window as any).ImageCapture(track);
      const bitmap: ImageBitmap = await ic.grabFrame();
      const dataUrl = cropBitmap(bitmap, crop, stream);
      bitmap.close();
      return toResult(dataUrl, "selection.jpg");
    } catch { /* fall through to video approach */ }
  }

  // Fallback: render to a hidden <video> and capture a frame
  const video = document.createElement("video");
  video.muted = true;
  video.srcObject = stream;
  await new Promise<void>((resolve) => { video.onloadedmetadata = () => resolve(); });
  await video.play();
  // Give browser two animation frames to paint
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  const canvas = document.createElement("canvas");
  const scaleX = video.videoWidth / window.innerWidth;
  const scaleY = video.videoHeight / window.innerHeight;

  if (crop) {
    canvas.width = Math.round(crop.w * scaleX);
    canvas.height = Math.round(crop.h * scaleY);
    canvas.getContext("2d")!.drawImage(
      video,
      Math.round(crop.x * scaleX), Math.round(crop.y * scaleY),
      Math.round(crop.w * scaleX), Math.round(crop.h * scaleY),
      0, 0, canvas.width, canvas.height
    );
  } else {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
  }

  const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
  return toResult(dataUrl, crop ? "selection.jpg" : "page-view.jpg");
}

function cropBitmap(
  bitmap: ImageBitmap,
  crop: { x: number; y: number; w: number; h: number } | undefined,
  stream: MediaStream
): string {
  const track = stream.getVideoTracks()[0];
  const { width: vw, height: vh } = track.getSettings();
  const scaleX = (vw || bitmap.width) / window.innerWidth;
  const scaleY = (vh || bitmap.height) / window.innerHeight;

  const canvas = document.createElement("canvas");
  if (crop) {
    canvas.width = Math.round(crop.w * scaleX);
    canvas.height = Math.round(crop.h * scaleY);
    canvas.getContext("2d")!.drawImage(
      bitmap,
      Math.round(crop.x * scaleX), Math.round(crop.y * scaleY),
      Math.round(crop.w * scaleX), Math.round(crop.h * scaleY),
      0, 0, canvas.width, canvas.height
    );
  } else {
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  }
  return canvas.toDataURL("image/jpeg", 0.88);
}

function toResult(dataUrl: string, fileName: string) {
  return { base64: dataUrl.split(",")[1], mediaType: "image/jpeg", fileName, dataUrl };
}

/** Full-page capture for the auto-screenshot feature (crops to visible page area) */
async function capturePageScreenshot(): Promise<{ base64: string; mediaType: string; fileName: string } | null> {
  const chatWidth = parseInt(document.body.style.marginLeft || "0", 10);
  const topOffset = 40;
  const result = await captureFrame({
    x: chatWidth, y: topOffset,
    w: window.innerWidth - chatWidth,
    h: window.innerHeight - topOffset,
  });
  return result;
}

/* ── Types ── */

interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface TextBlock {
  type: "text";
  text: string;
}

type _ContentBlock = TextBlock | ToolUseBlock;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolUses?: ToolUseBlock[];
  images?: string[]; // data URLs for inline display (e.g. selection screenshots)
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  dbId?: string; // Supabase row ID (set after first save)
}

interface AttachedFile {
  id: string;
  file: File;
  preview?: string;    // data URL for image previews
  base64?: string;     // base64 data for sending to Claude vision
  mediaType?: string;
  uploadedUrl?: string; // public URL after upload to Supabase Storage
  uploading?: boolean;
}

interface AdminChatProps {
  userId: string;
  userName: string;
  currentPage?: string;
  position?: "left" | "bottom";
}

/* ── Image Search Card ── */
function ImageSearchCard({ input, onUse }: { input: Record<string, unknown>; onUse: (url: string) => void }) {
  const [images, setImages] = useState<Array<{ url: string; thumb: string; description: string; credit: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [used, setUsed] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cms/search-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: input.query, count: input.count || 4, orientation: input.orientation || "landscape" }),
    })
      .then(r => r.json())
      .then(d => { setImages(d.images || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/30 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-100 bg-blue-50/50">
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">🔍 Image Search</span>
        <span className="text-xs text-gray-500 truncate">&ldquo;{String(input.query)}&rdquo;</span>
      </div>
      <div className="p-3">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
            <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Searching for images...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.map((img, i) => (
              <div key={i} className={`relative rounded-lg overflow-hidden border-2 transition-all ${used === img.url ? "border-green-400" : "border-transparent hover:border-blue-300"}`}>
                <img src={img.thumb} alt={img.description} className="w-full h-24 object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-end">
                  <button
                    onClick={() => { setUsed(img.url); onUse(img.url); }}
                    className="w-full py-1.5 text-xs font-semibold text-white bg-blue-600/90 hover:bg-blue-700 transition-colors opacity-0 hover:opacity-100"
                  >
                    {used === img.url ? "✓ Selected" : "Use this photo"}
                  </button>
                </div>
                {used === img.url && (
                  <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</div>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && images.length === 0 && (
          <p className="text-xs text-gray-500 py-2">No images found. Try a different search term.</p>
        )}
      </div>
    </div>
  );
}

/* ── Image Generation Card ── */
function ImageGenerateCard({ input, onUse }: { input: Record<string, unknown>; onUse: (url: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [used, setUsed] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/cms/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
      .then(r => r.json())
      .then(d => {
        if (d.url) { setUrl(d.url); setNote(d.note || ""); }
        else setError(d.error || "Generation failed");
        setLoading(false);
      })
      .catch(() => { setError("Network error"); setLoading(false); });
  }, []);

  return (
    <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50/20 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-purple-100 bg-purple-50/40">
        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">✨ AI Image</span>
        <span className="text-xs text-gray-500 truncate">{String(input.prompt).slice(0, 60)}…</span>
      </div>
      <div className="p-3">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-6 text-sm text-gray-500">
            <svg className="animate-spin h-6 w-6 text-purple" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span>Generating image…</span>
          </div>
        ) : error ? (
          <p className="text-xs text-red-600 py-2">⚠ {error}</p>
        ) : url ? (
          <>
            <img src={url} alt="Generated" className="w-full rounded-lg object-cover max-h-48 mb-2" />
            {note && <p className="text-[10px] text-amber-600 mb-2">{note}</p>}
            <button
              onClick={() => { setUsed(true); onUse(url); }}
              className={`w-full rounded-lg py-2 text-xs font-semibold transition-colors ${used ? "bg-green-100 text-green-700" : "bg-purple text-white hover:bg-purple/90"}`}
            >
              {used ? "✓ Using this image" : "Use this image"}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ── Tool preview card renderer ── */
function ToolPreviewCard({
  toolUse,
  onEdit,
  onSendMessage,
}: {
  toolUse: ToolUseBlock;
  onEdit?: (instruction: string) => void;
  onSendMessage?: (msg: string) => void;
}) {
  const input = toolUse.input;
  // Draft flow: idle → saving (auto-save as draft) → draft → publishing → published
  const [state, setState] = useState<
    "idle" | "saving" | "draft" | "publishing" | "published" | "discarded" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [draftMeta, setDraftMeta] = useState<{ table: string; id: string } | null>(null);

  const cardHeader = () => {
    switch (toolUse.name) {
      case "create_event": return "New Event";
      case "update_event": return "Event Update";
      case "delete_event": return "Delete Event";
      case "create_announcement": return "Announcement";
      case "update_hours": return "Hours Update";
      case "add_closure": return "Closure";
      case "create_staff_pick": return "Staff Pick";
      case "update_page_content": return "Page Content";
      case "upload_image": return "Image Upload";
      case "send_newsletter_draft": return "Newsletter Draft";
      case "get_analytics": return "Analytics Report";
      default: return toolUse.name;
    }
  };

  // Auto-save as draft when the card first appears
  useEffect(() => {
    if (state !== "idle") return;
    // Don't auto-save image tools or analytics/non-content tools
    if (["search_images", "generate_image", "get_analytics", "send_newsletter_draft", "upload_image"].includes(toolUse.name)) return;

    const saveDraft = async () => {
      setState("saving");
      try {
        const res = await fetch("/api/ai/admin/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toolName: toolUse.name,
            toolInput: toolUse.input,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || `Error ${res.status}`);

        // For new page sections (no prior published content), server returns status "published" — skip draft
        if (toolUse.name === "update_page_content" && data.result?.status === "published") {
          setState("published");
          window.dispatchEvent(new Event("cms-published"));
          return;
        }
        // Store draft metadata for later publish
        if (data.draft?.table && data.draft?.id) {
          setDraftMeta({ table: data.draft.table, id: data.draft.id });
        }
        setState("draft");
        // Refresh preview to show the draft
        window.dispatchEvent(new Event("cms-published"));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to save draft";
        setErrorMessage(msg);
        setState("error");
      }
    };
    saveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublish = async () => {
    if (!draftMeta) return;
    setState("publishing");
    setErrorMessage("");
    try {
      const res = await fetch("/api/cms/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          table: draftMeta.table,
          id: draftMeta.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || `Error ${res.status}`);
      setState("published");
      window.dispatchEvent(new Event("cms-published"));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to publish";
      setErrorMessage(msg);
      setState("error");
    }
  };

  const handleDiscard = async () => {
    if (!draftMeta) return;
    try {
      await fetch("/api/cms/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "discard",
          table: draftMeta.table,
          id: draftMeta.id,
        }),
      });
      setState("discarded");
      window.dispatchEvent(new Event("cms-published"));
    } catch {
      // Best effort
    }
  };

  const handleEdit = () => {
    const title = (input.title as string) || toolUse.name.replace(/_/g, " ");
    onEdit?.(`I want to make changes to the ${title} — `);
  };

  const statusBadge = () => {
    switch (state) {
      case "saving": return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Saving draft...</span>;
      case "draft": return <button onClick={() => { window.dispatchEvent(new Event("cms-published")); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer">Draft — refresh preview ↻</button>;
      case "publishing": return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Publishing...</span>;
      case "published": return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">✓ Live</span>;
      case "discarded": return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Discarded</span>;
      case "error": return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Error</span>;
      default: return null;
    }
  };

  /* ── Image tools render immediately without draft flow (after all hooks) ── */
  if (toolUse.name === "search_images") {
    return <ImageSearchCard input={input as Record<string, unknown>} onUse={(url) => {
      onSendMessage?.(`Use this image on the page: ${url}`);
    }} />;
  }
  if (toolUse.name === "generate_image") {
    return <ImageGenerateCard input={input as Record<string, unknown>} onUse={(url) => {
      const purpose = (input.purpose as string) || "";
      onSendMessage?.(`The generated image is ready. Please update the page with this image URL: ${url}${purpose ? ` (purpose: ${purpose})` : ""}`);
    }} />;
  }

  return (
    <div className={`mt-3 rounded-xl border overflow-hidden shadow-sm ${
      state === "draft" ? "border-amber-300 bg-amber-50/30" :
      state === "published" ? "border-green-300 bg-white" :
      state === "discarded" ? "border-gray-200 bg-gray-50 opacity-60" :
      "border-gray-200 bg-white"
    }`}>
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
        <span className="inline-flex items-center rounded-full bg-purple-light px-2.5 py-0.5 text-xs font-medium text-purple">
          {cardHeader()}
        </span>
        {statusBadge()}
      </div>

      {/* Card body */}
      <div className="px-4 py-3 space-y-1.5 text-sm">
        {Object.entries(input).map(([key, value]) => {
          if (value === undefined || value === null) return null;
          const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          if (typeof value === "object" && Array.isArray(value)) {
            return (
              <div key={key}>
                <span className="font-medium text-gray-600">{label}:</span>
                <ul className="ml-4 mt-1 space-y-1">
                  {value.map((item, i) => (
                    <li key={i} className="text-gray-700">
                      {typeof item === "object" ? JSON.stringify(item) : String(item)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          return (
            <div key={key} className="flex gap-2">
              <span className="font-medium text-gray-600 shrink-0">{label}:</span>
              <span className="text-gray-700">{String(value)}</span>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {state === "error" && (
        <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          <div className="font-semibold mb-0.5">⚠ Failed to save</div>
          <div className="text-red-600">{errorMessage || "Unknown error"}</div>
          <div className="mt-1.5 text-red-500">Check Supabase table schema — you may need to run the SQL migration in supabase-migration-drafts.sql</div>
        </div>
      )}

      {/* Card actions */}
      {!["get_analytics", "send_newsletter_draft", "upload_image"].includes(toolUse.name) && state !== "discarded" && (
        <div className="flex gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/30">
          {state === "published" ? (
            <span className="rounded-lg bg-green-100 px-4 py-2 text-xs font-semibold text-green-700 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Published to live site
            </span>
          ) : state === "draft" ? (
            <>
              <button
                onClick={handlePublish}
                className="rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
                Publish to Live Site
              </button>
              <button
                onClick={handleEdit}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDiscard}
                className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                Discard
              </button>
            </>
          ) : state === "saving" ? (
            <span className="rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving to preview...
            </span>
          ) : state === "publishing" ? (
            <span className="rounded-lg bg-purple-100 px-4 py-2 text-xs font-semibold text-purple flex items-center gap-1.5">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Publishing...
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

/* ── Typing indicator ── */
/* ── Selection overlay — drag to select any part of the page ── */
function SelectionOverlay({ onSubmit, onCancel }: {
  onSubmit: (text: string, image: { base64: string; mediaType: string; fileName: string; dataUrl: string } | null) => void;
  onCancel: () => void;
}) {
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [popover, setPopover] = useState<{ x: number; y: number } | null>(null);
  const [text, setText] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const QUICK = [
    { label: "Remove it", prompt: "Please remove this element from the page." },
    { label: "Change text", prompt: "Please update the text in this area." },
    { label: "Find image", prompt: "Please find a good stock photo for this section." },
    { label: "Generate image", prompt: "Please generate an AI image for this section." },
    { label: "Change style", prompt: "Please update the styling or color scheme of this section." },
    { label: "Make bigger", prompt: "Please make this section more prominent or larger." },
  ];

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".selection-popover")) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setRect(null);
    setPopover(null);
    setText("");
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    const x = Math.min(dragStart.current.x, e.clientX);
    const y = Math.min(dragStart.current.y, e.clientY);
    const w = Math.abs(e.clientX - dragStart.current.x);
    const h = Math.abs(e.clientY - dragStart.current.y);
    if (w > 8 || h > 8) setRect({ x, y, w, h });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragStart.current || !rect || rect.w < 20 || rect.h < 20) {
      dragStart.current = null;
      return;
    }
    dragStart.current = null;
    // Position popover below/right of selection, clamped to viewport
    const px = Math.min(rect.x, window.innerWidth - 320);
    const py = Math.min(rect.y + rect.h + 8, window.innerHeight - 260);
    setPopover({ x: px, y: py });
    setTimeout(() => inputRef.current?.focus(), 50);
    e.stopPropagation();
  };

  const capture = async (promptText: string) => {
    setCapturing(true);
    let img: { base64: string; mediaType: string; fileName: string; dataUrl: string } | null = null;
    if (rect) {
      // Use getDisplayMedia for a true pixel-perfect screenshot of the selected region
      img = await captureFrame(rect);
      if (img) setPreview(img.dataUrl);
    }
    setCapturing(false);
    onSubmit(promptText, img);
  };

  const handleSubmit = (prompt?: string) => {
    const finalText = prompt || text.trim();
    if (!finalText) return;
    capture(finalText);
  };

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9998]"
      style={{ cursor: rect && popover ? "default" : "crosshair" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Escape hint */}
      {!popover && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          Drag to select an area · Esc to cancel
        </div>
      )}

      {/* Selection rectangle */}
      {rect && (
        <div
          className="absolute border-2 border-purple bg-purple/10 pointer-events-none"
          style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
        >
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-purple rounded-sm" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple rounded-sm" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-purple rounded-sm" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-purple rounded-sm" />
        </div>
      )}

      {/* Popover */}
      {popover && (
        <div
          className="selection-popover absolute z-[9999] w-72 rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
          style={{ left: popover.x, top: popover.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 pt-3 pb-2 border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">What do you want to do?</p>
            <div className="flex gap-1.5">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onCancel(); }}
                placeholder="Describe what to change..."
                className="flex-1 text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 outline-none focus:border-purple focus:ring-1 focus:ring-purple/20"
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!text.trim() || capturing}
                className="rounded-lg bg-purple px-2.5 py-1.5 text-white disabled:opacity-40 hover:bg-purple-600 transition-colors"
              >
                {capturing ? (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1">
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => handleSubmit(q.prompt)}
                disabled={capturing}
                className="text-left text-xs rounded-lg px-2.5 py-2 border border-gray-100 text-gray-600 hover:bg-purple-50 hover:border-purple/30 hover:text-purple transition-colors disabled:opacity-40"
              >
                {q.label}
              </button>
            ))}
          </div>
          <div className="px-3 pb-2 flex justify-end">
            <button onClick={onCancel} className="text-[11px] text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="rounded-2xl rounded-bl-md bg-purple-50 px-4 py-3 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-purple-300 animate-pulse-dot" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 rounded-full bg-purple-300 animate-pulse-dot" style={{ animationDelay: "300ms" }} />
        <span className="h-2 w-2 rounded-full bg-purple-300 animate-pulse-dot" style={{ animationDelay: "600ms" }} />
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function AdminChat({ userId: _userId, userName, currentPage, position = "left" }: AdminChatProps) {
  const isBottom = position === "bottom";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [previewPage, setPreviewPage] = useState(currentPage || "/");
  const [isCapturing, setIsCapturing] = useState(false);
  const [autoScreenshot, setAutoScreenshot] = useState(true); // auto-capture with every message
  const [selectMode, setSelectMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"claude" | "gemini">("claude");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const historyBtnRef = useRef<HTMLButtonElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* Sync preview page from prop (direct integration — no iframe) */
  useEffect(() => {
    if (currentPage) setPreviewPage(currentPage);
  }, [currentPage]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  /* Load saved conversations on mount */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ai/admin/chat-sessions");
        if (res.ok) {
          const data = await res.json();
          if (data.sessions && data.sessions.length > 0) {
            const loaded: Conversation[] = data.sessions.map(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (s: any) => ({
                id: crypto.randomUUID(),
                dbId: s.id,
                title: s.title,
                messages: [], // Lazy-load messages
                createdAt: new Date(s.created_at),
                updatedAt: new Date(s.updated_at),
              })
            );
            setConversations(loaded);
          }
        }
      } catch {
        // Offline — proceed with empty
      } finally {
        setIsLoadingSessions(false);
      }
    })();
  }, []);

  /* Load messages for a conversation when selected */
  const loadConversationMessages = useCallback(
    async (conv: Conversation) => {
      if (!conv.dbId || conv.messages.length > 0) return;

      try {
        const res = await fetch(`/api/ai/admin/chat-sessions?id=${conv.dbId}`);
        if (!res.ok) return;
        const data = await res.json();
        const raw = data.session?.messages;
        const msgs: ChatMessage[] = Array.isArray(raw)
          ? raw
          : typeof raw === "string"
          ? JSON.parse(raw)
          : [];
        if (msgs.length === 0) return;
        setConversations((prev) =>
          prev.map((c) => (c.id === conv.id ? { ...c, messages: msgs } : c))
        );
      } catch {
        // Fail silently
      }
    },
    []
  );

  useEffect(() => {
    if (activeConversation && activeConversation.dbId && activeConversation.messages.length === 0) {
      loadConversationMessages(activeConversation);
    }
  }, [activeConversation, loadConversationMessages]);

  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isLoading]);

  /* Auto-resize textarea */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  /* Escape cancels select mode */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectMode(false); };
    window.addEventListener("keydown", handler as unknown as EventListener);
    return () => window.removeEventListener("keydown", handler as unknown as EventListener);
  }, []);

  /* Save conversation to Supabase (debounced) */
  const saveConversation = useCallback(
    (conv: Conversation) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const payload = {
            sessionId: conv.dbId || undefined,
            title: conv.title,
            messages: conv.messages.map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              toolUses: m.toolUses,
              timestamp: m.timestamp,
            })),
          };

          const res = await fetch("/api/ai/admin/chat-sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.session && !conv.dbId) {
              // Set the db ID on first save
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === conv.id ? { ...c, dbId: data.session.id } : c
                )
              );
            }
          }
        } catch {
          // Fail silently — conversation exists locally
        }
      }, 1000);
    },
    []
  );

  /* New conversation */
  const startConversation = useCallback((firstMessage?: string) => {
    const id = crypto.randomUUID();
    const conv: Conversation = {
      id,
      title: firstMessage?.slice(0, 50) || "New conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(id);
    return id;
  }, []);

  /* Send message */
  const sendMessage = useCallback(
    async (
      text: string,
      extraImages?: { base64: string; mediaType: string; fileName: string }[],
      displayImages?: string[]  // data URLs to show inline in the user bubble
    ) => {
      if ((!text.trim() && attachedFiles.length === 0) || isLoading) return;

      let convId = activeConversationId;
      const displayText = text.trim() || (attachedFiles.length > 0 ? `[${attachedFiles.length} file(s) attached]` : "");
      if (!convId) {
        convId = startConversation(displayText);
      }

      // Build file info for display
      const fileNames = attachedFiles.map((f) => f.file.name);
      const contentWithFiles = fileNames.length > 0
        ? `${text.trim()}${text.trim() ? "\n" : ""}📎 ${fileNames.join(", ")}`
        : text.trim();

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: contentWithFiles,
        images: displayImages,
        timestamp: new Date(),
      };

      // Collect image data to send to API (user-attached files)
      const userImages = attachedFiles
        .filter((f) => f.base64 && f.mediaType)
        .map((f) => ({
          base64: f.base64!,
          mediaType: f.mediaType!,
          fileName: f.file.name,
        }));

      // Auto-capture page screenshot so the AI can see the current page visually.
      // Skip if extraImages are provided (e.g. selection capture already gives focused context).
      let pageScreenshot: { base64: string; mediaType: string; fileName: string } | null = null;
      if (autoScreenshot && (!extraImages || extraImages.length === 0)) {
        setIsCapturing(true);
        pageScreenshot = await capturePageScreenshot();
        setIsCapturing(false);
      }

      // Page screenshot goes first so Claude sees context before user files
      const images = [
        ...(pageScreenshot ? [pageScreenshot] : []),
        ...(extraImages || []),
        ...userImages,
      ];

      // Non-image file names for context
      const nonImageFiles = attachedFiles
        .filter((f) => !f.base64)
        .map((f) => f.file.name);

      // Add user message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, title: c.messages.length === 0 ? displayText.slice(0, 50) : c.title, messages: [...c.messages, userMessage], updatedAt: new Date() }
            : c
        )
      );
      setInput("");
      setAttachedFiles([]);
      setIsLoading(true);

      try {
        // Build conversation history for API
        const conv = conversations.find((c) => c.id === convId);
        const history = (conv?.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Add file context to message
        let messageText = text.trim();
        if (nonImageFiles.length > 0) {
          messageText += `\n\n[Files attached: ${nonImageFiles.join(", ")}]`;
        }
        // Tell Claude the permanent storage URLs for any uploaded images
        const uploadedImages = attachedFiles.filter((f) => f.uploadedUrl);
        if (uploadedImages.length > 0) {
          messageText += `\n\n[Image URLs already uploaded to storage: ${uploadedImages.map((f) => `${f.file.name} → ${f.uploadedUrl}`).join(", ")}. Use these exact URLs when updating page content — do not call upload_image.]`;
        }

        // Let Claude know what the attached image(s) represent
        if (extraImages && extraImages.length > 0) {
          messageText = `[The attached image is a screenshot of the specific area the staff member selected on the page. Focus your response on this selected region.]\n\n${messageText}`;
        } else if (pageScreenshot) {
          messageText = `[The first attached image is a real-time screenshot of the page the staff member is currently viewing on their screen. Use it to understand the current visual appearance, layout, and design before making changes.]\n\n${messageText}`;
        }

        const res = await fetch("/api/ai/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText || "Please look at the attached image(s).",
            conversationHistory: history,
            images,
            currentPage: previewPage,
            model: selectedModel,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `Error ${res.status}`);
        }

        // Read the streaming response
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        let fullText = "";
        const toolUses: ToolUseBlock[] = [];
        let currentToolInput = "";
        let currentToolId = "";
        let currentToolName = "";
        let collectingToolInput = false;
        const decoder = new TextDecoder();

        // Create assistant message placeholder
        const assistantId = crypto.randomUUID();
        const assistantMessage: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content: "",
          toolUses: [],
          timestamp: new Date(),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, assistantMessage] }
              : c
          )
        );

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line);

              if (event.type === "content_block_start") {
                if (event.content_block?.type === "tool_use") {
                  collectingToolInput = true;
                  currentToolId = event.content_block.id || "";
                  currentToolName = event.content_block.name || "";
                  currentToolInput = "";
                }
              } else if (event.type === "content_block_delta") {
                if (event.delta?.type === "text_delta" && event.delta.text) {
                  fullText += event.delta.text;
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === convId
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === assistantId
                                ? { ...m, content: fullText }
                                : m
                            ),
                          }
                        : c
                    )
                  );
                } else if (event.delta?.type === "input_json_delta" && event.delta.partial_json) {
                  currentToolInput += event.delta.partial_json;
                }
              } else if (event.type === "content_block_stop") {
                if (collectingToolInput) {
                  try {
                    const parsedInput = JSON.parse(currentToolInput);
                    const tu: ToolUseBlock = {
                      type: "tool_use",
                      id: currentToolId,
                      name: currentToolName,
                      input: parsedInput,
                    };
                    toolUses.push(tu);
                    setConversations((prev) =>
                      prev.map((c) =>
                        c.id === convId
                          ? {
                              ...c,
                              messages: c.messages.map((m) =>
                                m.id === assistantId
                                  ? { ...m, toolUses: [...toolUses] }
                                  : m
                              ),
                            }
                          : c
                      )
                    );
                  } catch {
                    // Incomplete JSON — skip
                  }
                  collectingToolInput = false;
                  currentToolInput = "";
                }
              } else if (event.type === "error") {
                throw new Error(event.error || "Stream error");
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        // Save conversation to Supabase after response completes
        const updatedConv = conversations.find((c) => c.id === convId);
        if (updatedConv) {
          // We need the latest version with both messages
          setConversations((prev) => {
            const latest = prev.find((c) => c.id === convId);
            if (latest) saveConversation(latest);
            return prev;
          });
        }
      } catch (err: unknown) {
        const errorText =
          err instanceof Error ? err.message : "Something went wrong";
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorText}`,
          timestamp: new Date(),
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, errorMessage] }
              : c
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, conversations, isLoading, startConversation, saveConversation, attachedFiles, previewPage, autoScreenshot, selectedModel]
  );

  /* Submit handler */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  /* Keyboard handler */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /* File processing */
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    for (const file of fileArray) {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large (max 10MB).`);
        continue;
      }

      const id = crypto.randomUUID();
      const isImage = allowedImageTypes.includes(file.type);

      if (isImage) {
        // Read as base64, show preview immediately, then upload to storage
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1];
          // Add with uploading state first
          setAttachedFiles((prev) => [
            ...prev,
            { id, file, preview: dataUrl, base64, mediaType: file.type, uploading: true },
          ]);
          // Upload to Supabase Storage
          try {
            const res = await fetch("/api/cms/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ base64, mediaType: file.type, fileName: file.name }),
            });
            const data = await res.json();
            if (res.ok && data.url) {
              setAttachedFiles((prev) =>
                prev.map((f) => f.id === id ? { ...f, uploadedUrl: data.url, uploading: false } : f)
              );
            } else {
              setAttachedFiles((prev) =>
                prev.map((f) => f.id === id ? { ...f, uploading: false } : f)
              );
            }
          } catch {
            setAttachedFiles((prev) =>
              prev.map((f) => f.id === id ? { ...f, uploading: false } : f)
            );
          }
        };
        reader.readAsDataURL(file);
      } else {
        // Non-image files — attach as reference
        setAttachedFiles((prev) => [
          ...prev,
          { id, file },
        ]);
      }
    }
  }, []);

  const removeAttachedFile = useCallback((id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /* Drag & drop handlers */
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  /* Delete conversation */
  const deleteConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv?.dbId) {
      // Delete from Supabase too
      try {
        await fetch(`/api/ai/admin/chat-sessions?id=${conv.dbId}`, {
          method: "DELETE",
        });
      } catch {
        // Best effort
      }
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) setActiveConversationId(null);
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 min-h-0">
      {/* ─── Chat header with history dropdown ─── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-2 py-1.5 flex flex-wrap items-center gap-1.5 min-w-0">
        {/* New conversation button */}
        <button
          onClick={() => {
            setActiveConversationId(null);
            setInput("");
            setSidebarOpen(false);
          }}
          className="shrink-0 flex items-center gap-1 rounded-lg bg-purple px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New
        </button>

        {/* Select mode button — primes tab capture permission before showing overlay */}
        <button
          onClick={async () => {
            if (!selectMode) {
              // Pre-request tab capture permission so the dialog appears now,
              // not mid-draw. If the user cancels, we just don't enter select mode.
              const stream = await getTabStream();
              if (!stream) return; // user declined permission
            }
            setSelectMode((v) => !v);
          }}
          title="Select an area on the page to edit"
          className={`shrink-0 flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
            selectMode
              ? "border-purple bg-purple text-white"
              : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h5M3 3v5M21 3h-5M21 3v5M3 21h5M3 21v-5M21 21h-5M21 21v-5"/>
          </svg>
          Select
        </button>

        {/* History dropdown toggle */}
        <div className="relative">
          <button
            ref={historyBtnRef}
            onClick={() => {
              if (!sidebarOpen && historyBtnRef.current) {
                const rect = historyBtnRef.current.getBoundingClientRect();
                setDropdownPos({ top: rect.bottom + 4, left: rect.left });
              }
              setSidebarOpen(!sidebarOpen);
            }}
            className={`shrink-0 flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              sidebarOpen
                ? "border-purple bg-purple-50 text-purple"
                : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            History
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${sidebarOpen ? "rotate-180" : ""}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {/* History dropdown panel — fixed so it escapes overflow:hidden on the chat panel */}
          {sidebarOpen && (
            <>
              <div className="fixed inset-0 z-[998]" onClick={() => setSidebarOpen(false)} />
              <div className="fixed z-[999] w-72 max-h-80 overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-lg chat-scrollbar"
                style={{ top: dropdownPos.top, left: dropdownPos.left }}
              >
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center py-6">
                    <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  </div>
                ) : conversations.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-gray-400 text-center">No conversations yet</p>
                ) : (
                  <div className="p-1.5">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`group flex items-center rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                          conv.id === activeConversationId
                            ? "bg-purple-50 text-purple"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setActiveConversationId(conv.id);
                          setSidebarOpen(false);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mr-2 opacity-50">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <span className="flex-1 truncate text-xs font-medium">{conv.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.id);
                          }}
                          className="hidden group-hover:block shrink-0 ml-1 rounded p-0.5 text-gray-400 hover:text-red hover:bg-red-light transition-colors"
                          aria-label="Delete conversation"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Spacer pushes model picker to the right */}
        <div className="flex-1 min-w-0" />

        {/* Model picker */}
        <div className="shrink-0 flex items-center rounded-lg border border-gray-200 overflow-hidden text-[11px] font-semibold">
          <button
            onClick={() => setSelectedModel("claude")}
            title="Claude Sonnet (Anthropic)"
            className={`flex items-center gap-1 px-2 py-1.5 transition-colors ${
              selectedModel === "claude"
                ? "bg-[#d4a574] text-white"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg width="10" height="9" viewBox="0 0 32 28" fill="currentColor">
              <path d="M16 0L32 28H0L16 0Z" />
            </svg>
            <span className="hidden sm:inline">Claude</span>
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <button
            onClick={() => setSelectedModel("gemini")}
            title="Gemini 2.0 Flash (Google)"
            className={`flex items-center gap-1 px-2 py-1.5 transition-colors ${
              selectedModel === "gemini"
                ? "bg-[#4285F4] text-white"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
            </svg>
            <span className="hidden sm:inline">Gemini</span>
          </button>
        </div>

        {/* Color picker toggle */}
        <button
          onClick={() => setShowColorPicker((v) => !v)}
          title={showColorPicker ? "Hide color picker" : "Show color picker"}
          className={`shrink-0 flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
            showColorPicker
              ? "border-purple bg-purple-50 text-purple"
              : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
          </svg>
        </button>
      </div>

      {/* Color picker bar — collapsible */}
      {showColorPicker && <ColorPickerBar />}

      {/* ─── Chat area ─── */}
      <div
        className="flex-1 flex flex-col min-w-0 min-h-0"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-20 bg-purple/5 border-2 border-dashed border-purple rounded-2xl m-4 flex items-center justify-center">
            <div className="text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="1.5" className="mx-auto mb-3">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <p className="text-sm font-medium text-purple">Drop files to upload</p>
              <p className="text-xs text-gray-500 mt-1">Images will be attached to your message</p>
            </div>
          </div>
        )}

        {/* Messages or welcome */}
        {!activeConversation || activeConversation.messages.length === 0 ? (
          /* ── Welcome screen ── */
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            <div className="max-w-md w-full text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-purple/10 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                Hi {userName}! 👋
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                What would you like to update?
              </p>
              <div className={isBottom ? "flex flex-wrap justify-center gap-1.5" : "flex flex-col gap-1.5"}>
                {[
                  { label: "Add Event", icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>, prompt: "I need to add a new event." },
                  { label: "Update Hours", icon: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>, prompt: "I need to update the library hours." },
                  { label: "Post Announcement", icon: <><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></>, prompt: "I want to post a new announcement." },
                  { label: "Staff Picks", icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>, prompt: "I want to add a new staff pick." },
                  { label: "Edit Page", icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, prompt: "I need to edit page content." },
                  { label: "Find Images", icon: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></>, prompt: "Search for photos I can use on the website." },
                  { label: "Generate Image", icon: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></>, prompt: "Generate a custom AI image for the website." },
                  { label: "Redesign Page", icon: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>, prompt: "Help me redesign this page — new text, new images, fresh look." },
                  { label: "Newsletter", icon: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></>, prompt: "I want to draft a newsletter." },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className={isBottom
                      ? "flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-gray-500 hover:border-purple/30 hover:bg-purple/5 hover:text-purple transition-all"
                      : "flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-500 hover:border-purple/30 hover:bg-purple/5 hover:text-purple transition-all text-left"
                    }
                  >
                    <svg width={isBottom ? 13 : 18} height={isBottom ? 13 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
                      {action.icon}
                    </svg>
                    <span className={isBottom ? "text-[11px] font-medium whitespace-nowrap" : "text-xs font-medium"}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Message list ── */
          <div className="flex-1 overflow-y-auto chat-scrollbar p-3 sm:p-4">
            <div className="space-y-3">
              {activeConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex animate-fade-in ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`min-w-0 max-w-[92%] ${
                      msg.role === "user"
                        ? "rounded-2xl rounded-br-md bg-primary text-white px-4 py-3"
                        : "rounded-2xl rounded-bl-md bg-purple-50 px-4 py-3 w-full"
                    }`}
                  >
                    {/* Inline screenshot thumbnails (selection captures) */}
                    {msg.images && msg.images.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {msg.images.map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt="Selected area"
                            className="rounded-lg border border-white/20 max-h-32 max-w-full object-cover shadow-sm"
                          />
                        ))}
                      </div>
                    )}

                    {/* Text content */}
                    {msg.content && (
                      <div
                        className={`text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere min-w-0 ${
                          msg.role === "user" ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* Tool use preview cards */}
                    {msg.toolUses?.map((tu) => (
                      <ToolPreviewCard
                        key={tu.id}
                        toolUse={tu}
                        onEdit={(instruction) => {
                          setInput(instruction);
                          textareaRef.current?.focus();
                        }}
                        onSendMessage={(msg) => sendMessage(msg)}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* ─── Input area ─── */}
        <div className="border-t border-gray-200 bg-white px-3 py-2 pb-safe">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processFiles(e.target.files);
              }
              e.target.value = ""; // reset so same file can be re-selected
            }}
          />

          <form
            onSubmit={handleSubmit}
            className="w-full"
          >
            {/* Attached files preview */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 px-1">
                {attachedFiles.map((af) => (
                  <div
                    key={af.id}
                    className="relative group flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5"
                  >
                    {af.preview ? (
                      <img
                        src={af.preview}
                        alt={af.file.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 max-w-[120px]">
                      <p className="text-[11px] font-medium text-gray-700 truncate">{af.file.name}</p>
                      {af.uploading ? (
                        <p className="text-[10px] text-blue-500 flex items-center gap-1">
                          <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
                          Uploading...
                        </p>
                      ) : af.uploadedUrl ? (
                        <p className="text-[10px] text-green-600 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                          Ready
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-400">{(af.file.size / 1024).toFixed(0)} KB</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachedFile(af.id)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-gray-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${af.file.name}`}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-2.5 py-1.5 transition-all">
              {/* Attach file button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-purple hover:bg-purple/10 disabled:opacity-40 transition-colors"
                aria-label="Attach file"
                title="Attach photos or files"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>

              {/* Page vision toggle — eye icon */}
              <button
                type="button"
                onClick={() => setAutoScreenshot((v) => !v)}
                disabled={isLoading}
                className={`shrink-0 rounded-lg p-1.5 transition-colors disabled:opacity-40 ${autoScreenshot ? "text-purple bg-purple/10 hover:bg-purple/20" : "text-gray-400 hover:text-purple hover:bg-purple/10"}`}
                aria-label={autoScreenshot ? "Page vision ON — AI sees your screen" : "Page vision OFF — click to enable"}
                title={autoScreenshot ? "Page vision ON — AI sees your screen with each message" : "Page vision OFF — click to enable"}
              >
                {isCapturing ? (
                  <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : autoScreenshot ? (
                  /* Eye open */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                ) : (
                  /* Eye closed */
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                )}
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachedFiles.length > 0 ? "Add a message about these files..." : ""}
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none resize-none leading-relaxed"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading || attachedFiles.some((f) => f.uploading)}
                className="shrink-0 rounded-xl bg-purple p-2.5 text-white hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Enter to send &middot; Shift+Enter for new line &middot; {autoScreenshot ? "👁 AI sees your page" : "👁 Page vision off"} &middot; 📎 to attach files
            </p>
          </form>
        </div>
      </div>

      {/* Selection overlay — rendered outside sidebar via portal */}
      {selectMode && (
        <SelectionOverlay
          onSubmit={(text, img) => {
            setSelectMode(false);
            sendMessage(
              `[Selected area on page] ${text}`,
              img ? [img] : undefined,
              img ? [img.dataUrl] : undefined
            );
          }}
          onCancel={() => setSelectMode(false)}
        />
      )}
    </div>
  );
}
