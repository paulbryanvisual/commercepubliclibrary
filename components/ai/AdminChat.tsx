"use client";

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent, type DragEvent } from "react";

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
  preview?: string; // data URL for image previews
  base64?: string;  // base64 data for sending to API
  mediaType?: string;
}

interface AdminChatProps {
  userId: string;
  userName: string;
}

/* ── Tool preview card renderer ── */
function ToolPreviewCard({
  toolUse,
  onEdit,
}: {
  toolUse: ToolUseBlock;
  onEdit?: (instruction: string) => void;
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
    // Don't auto-save analytics or non-content tools
    if (["get_analytics", "send_newsletter_draft", "upload_image"].includes(toolUse.name)) return;

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
      case "draft": return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Draft — Preview it →</span>;
      case "publishing": return <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Publishing...</span>;
      case "published": return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">✓ Live</span>;
      case "discarded": return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Discarded</span>;
      case "error": return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">Error</span>;
      default: return null;
    }
  };

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
      {state === "error" && errorMessage && (
        <div className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
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
function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="h-8 w-8 shrink-0 rounded-full bg-purple flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="rounded-2xl bg-purple-50 px-4 py-3 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-purple-300 animate-pulse-dot" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 rounded-full bg-purple-300 animate-pulse-dot" style={{ animationDelay: "300ms" }} />
        <span className="h-2 w-2 rounded-full bg-purple-300 animate-pulse-dot" style={{ animationDelay: "600ms" }} />
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function AdminChat({ userId: _userId, userName }: AdminChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [previewPage, setPreviewPage] = useState("/");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* Listen for preview page changes */
  useEffect(() => {
    const handler = (e: Event) => {
      const path = (e as CustomEvent).detail;
      if (typeof path === "string") setPreviewPage(path);
    };
    window.addEventListener("preview-navigate", handler);
    return () => window.removeEventListener("preview-navigate", handler);
  }, []);

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
        // Fetch the full session with messages
        const res = await fetch(`/api/ai/admin/chat-sessions`);
        if (!res.ok) return;
        // We need a way to get a single session — for now, re-fetch and find
        // Actually, let's just fetch all and find ours. This is fine for a small admin app.
        // In a real app, we'd have a GET /api/ai/admin/chat-sessions/:id endpoint.
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
    async (text: string) => {
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
        timestamp: new Date(),
      };

      // Collect image data to send to API
      const images = attachedFiles
        .filter((f) => f.base64 && f.mediaType)
        .map((f) => ({
          base64: f.base64!,
          mediaType: f.mediaType!,
          fileName: f.file.name,
        }));

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

        // Add file context to message if non-image files attached
        let messageText = text.trim();
        if (nonImageFiles.length > 0) {
          messageText += `\n\n[Files attached: ${nonImageFiles.join(", ")}]`;
        }

        const res = await fetch("/api/ai/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText || "Please look at the attached image(s).",
            conversationHistory: history,
            images,
            currentPage: previewPage,
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
    [activeConversationId, conversations, isLoading, startConversation, saveConversation, attachedFiles, previewPage]
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
        // Read as base64 for API + create preview
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1];
          setAttachedFiles((prev) => [
            ...prev,
            { id, file, preview: dataUrl, base64, mediaType: file.type },
          ]);
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
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2 flex items-center gap-2">
        {/* New conversation button */}
        <button
          onClick={() => {
            setActiveConversationId(null);
            setInput("");
            setSidebarOpen(false);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-purple px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-600 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New
        </button>

        {/* History dropdown toggle */}
        <div className="relative">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
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

          {/* History dropdown panel */}
          {sidebarOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-40 w-72 max-h-80 overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-lg chat-scrollbar">
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Powered by badge */}
        <span className="text-[10px] text-gray-400">Powered by Claude AI</span>
      </div>

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

              {/* Quick action buttons */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { label: "Add Event", icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>, prompt: "I need to add a new event." },
                  { label: "Update Hours", icon: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>, prompt: "I need to update the library hours." },
                  { label: "Post Announcement", icon: <><path d="M3 11l18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></>, prompt: "I want to post a new announcement." },
                  { label: "Staff Picks", icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>, prompt: "I want to add a new staff pick." },
                  { label: "Edit Page", icon: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>, prompt: "I need to edit page content." },
                  { label: "Newsletter", icon: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></>, prompt: "I want to draft a newsletter." },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-4 text-gray-500 hover:border-purple/30 hover:bg-purple/5 hover:text-purple transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      {action.icon}
                    </svg>
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Message list ── */
          <div className="flex-1 overflow-y-auto chat-scrollbar p-4 sm:p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {activeConversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 animate-fade-in ${
                    msg.role === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-purple flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] ${
                      msg.role === "user"
                        ? "rounded-2xl rounded-br-md bg-primary text-white px-4 py-3"
                        : "rounded-2xl rounded-bl-md bg-purple-50 px-4 py-3"
                    }`}
                  >
                    {/* Text content */}
                    {msg.content && (
                      <div
                        className={`text-sm leading-relaxed whitespace-pre-wrap ${
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
                      />
                    ))}
                  </div>

                  {msg.role === "user" && (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-primary-dark flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase">
                        {userName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* ─── Input area ─── */}
        <div className="border-t border-gray-200 bg-white p-3 sm:p-4 pb-safe">
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
            className="max-w-3xl mx-auto"
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
                      <p className="text-[10px] text-gray-400">{(af.file.size / 1024).toFixed(0)} KB</p>
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

            <div className="flex items-end gap-2 rounded-2xl bg-gray-50 border border-gray-200 px-3 py-2.5 focus-within:border-purple focus-within:ring-1 focus-within:ring-purple/30 transition-all">
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

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachedFiles.length > 0 ? "Add a message about these files..." : "Tell the AI what to update..."}
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none resize-none leading-relaxed"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                className="shrink-0 rounded-xl bg-purple p-2.5 text-white hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Enter to send &middot; Shift+Enter for new line &middot; Drag &amp; drop or 📎 to attach files
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
