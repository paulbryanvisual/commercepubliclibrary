"use client";

import { useState, useEffect, useRef, useCallback, type FormEvent, type KeyboardEvent } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const hasVisited = localStorage.getItem("cpl-chat-visited");
    if (!hasVisited) {
      setShowPulse(true);
      localStorage.setItem("cpl-chat-visited", "true");
      const timer = setTimeout(() => setShowPulse(false), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const history = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim(), conversationHistory: history }),
        });

        if (!res.ok) {
          throw new Error("Failed to get response");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        let fullText = "";
        const assistantId = crypto.randomUUID();
        setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

        const decoder = new TextDecoder();
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
              if (event.type === "content_block_delta" && event.delta?.type === "text_delta" && event.delta.text) {
                fullText += event.delta.text;
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantId ? { ...m, content: fullText } : m))
                );
              } else if (event.type === "error") {
                throw new Error(event.error);
              }
            } catch {
              // skip
            }
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Sorry, I'm having trouble connecting right now. You can reach a librarian at (903) 886-6858 or director@commercepubliclibrary.org.",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const suggestions = [
    "What are today's hours?",
    "Find a book",
    "Upcoming events",
    "How do I get a card?",
  ];

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-8rem)] rounded-2xl bg-white border border-gray-200 shadow-2xl flex flex-col animate-slide-up overflow-hidden"
          role="dialog"
          aria-label="Library AI Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-primary-dark text-white">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Library AI Assistant</p>
                <p className="text-xs text-primary-200">Ask me anything about the library</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 hover:bg-white/10 transition-colors"
              aria-label="Close chat"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-14 w-14 rounded-full bg-purple-light flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2" aria-hidden="true">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-medium text-gray-800 mb-1">
                  Hi! I&apos;m the Library AI
                </h3>
                <p className="text-sm text-gray-500 mb-5 max-w-[280px]">
                  I can help you find books, check hours, learn about events, and more.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className="rounded-full bg-purple-light px-3 py-1.5 text-xs font-medium text-purple hover:bg-purple-100 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="h-7 w-7 shrink-0 rounded-full bg-primary flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-white rounded-br-md"
                          : "bg-gray-100 text-gray-700 rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2.5">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-primary flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse-dot" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse-dot" style={{ animationDelay: "300ms" }} />
                      <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse-dot" style={{ animationDelay: "600ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3">
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the library AI..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="rounded-lg bg-primary p-1.5 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-mid transition-colors"
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-mid hover:shadow-xl transition-all ${
          showPulse ? "animate-bounce" : ""
        }`}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  );
}
