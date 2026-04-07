"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Role = "rep" | "lead";
type Msg = { id: string; role: Role; text: string; at: number };

type Props = {
  session: string;
  prospectFirstName: string;
  companyName: string;
  logoUrl?: string;
  coldTimeoutMs?: number;
};

export default function SmsDemo({
  session,
  prospectFirstName,
  companyName,
  logoUrl,
  coldTimeoutMs = 60_000,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [callState, setCallState] = useState<"idle" | "calling" | "called">("idle");
  const lastLeadAtRef = useRef<number>(0);
  const firedRef = useRef(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll and auto-focus input on new messages.
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
    if (!typing) inputRef.current?.focus();
  }, [messages, typing]);

  const sendTurn = useCallback(
    async (history: Msg[]) => {
      setTyping(true);
      try {
        const res = await fetch("/api/sms-turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session,
            history: history.map((m) => ({ role: m.role, text: m.text })),
          }),
        });
        const json = await res.json();
        if (res.ok && json.message) {
          // Brief human-feeling delay so it doesn't feel instant.
          await new Promise((r) => setTimeout(r, 700));
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "rep", text: json.message, at: Date.now() },
          ]);
        }
      } finally {
        setTyping(false);
      }
    },
    [session],
  );

  // Kick off with opening message (guard against Strict Mode double-fire).
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    sendTurn([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cold timer: starts after the first lead reply.
  useEffect(() => {
    if (firedRef.current) return;
    const hasLeadReply = messages.some((m) => m.role === "lead");
    if (!hasLeadReply) return;

    const tick = () => {
      const elapsed = Date.now() - lastLeadAtRef.current;
      const remain = Math.max(0, coldTimeoutMs - elapsed);
      if (remain <= 0 && !firedRef.current) {
        firedRef.current = true;
        triggerCall();
      }
    };
    const id = setInterval(tick, 500);
    tick();
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, coldTimeoutMs]);

  async function triggerCall() {
    setCallState("calling");
    try {
      const res = await fetch("/api/voice-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          smsHistory: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      if (res.ok) setCallState("called");
      else setCallState("idle");
    } catch {
      setCallState("idle");
    }
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || typing) return;
    const next: Msg[] = [
      ...messages,
      { id: crypto.randomUUID(), role: "lead", text, at: Date.now() },
    ];
    setMessages(next);
    setInput("");
    lastLeadAtRef.current = Date.now();
    await sendTurn(next);
  }

  return (
    <div className="chat-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <style>{`
        @keyframes cta-glow {
          0%, 100% { box-shadow: 0 0 6px 1px rgba(59,130,246,0.5); }
          50% { box-shadow: 0 0 18px 5px rgba(59,130,246,0.7); }
        }
        @keyframes send-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
          50% { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
        }
      `}</style>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="glass mb-3 flex items-center justify-between rounded-3xl px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={companyName}
                className="h-9 w-9 rounded-full object-cover"
                onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.classList.remove("hidden"); }}
              />
            ) : null}
            <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-semibold text-white ${logoUrl ? "hidden" : ""}`}>
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate text-sm font-semibold text-neutral-900 sm:text-base">{companyName}</div>
          </div>
          <a
            href="https://cal.com/readymation/ai-reactivation"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-blue-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-400 active:scale-95 sm:px-4 sm:text-xs"
            style={{ animation: "cta-glow 2s ease-in-out infinite" }}
          >
            Book Now
          </a>
        </div>

        {/* Banner */}
        {callState === "called" && (
          <Banner tone="success">You have an incoming call. Check your phone.</Banner>
        )}

        {/* Messages */}
        <div
          ref={scrollerRef}
          className="glass h-[520px] overflow-y-auto rounded-3xl px-4 py-5 shadow-sm"
        >
          <p className="mb-4 text-center text-[11px] text-neutral-500">
            Reply below as if you were the cold lead.
          </p>
          <div className="flex flex-col gap-2">
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} text={m.text} />
            ))}
            {typing && <TypingBubble />}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={onSend} className="mt-3 flex items-center gap-2">
          <div className="glass flex flex-1 items-center rounded-full px-4 py-2 shadow-sm">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Text message"
              className="w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              disabled={callState !== "idle"}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || typing || callState !== "idle"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40"
            style={(!input.trim() || typing || callState !== "idle") ? undefined : { animation: "send-pulse 2s ease-in-out infinite" }}
            aria-label="Send"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M3.4 2.6a1 1 0 0 0-1.3 1.3l2.3 5.7L12 10l-7.6.4-2.3 5.7a1 1 0 0 0 1.3 1.3l15-7a1 1 0 0 0 0-1.8l-15-7z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ role, text }: { role: Role; text: string }) {
  const isRep = role === "rep";
  return (
    <div className={`flex ${isRep ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[78%] rounded-[22px] px-4 py-2 text-[15px] leading-snug shadow-sm ${
          isRep ? "bubble-in rounded-bl-md" : "bubble-out rounded-br-md"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="bubble-in flex items-center gap-1 rounded-[22px] rounded-bl-md px-4 py-3 shadow-sm">
        <span className="dot h-1.5 w-1.5 rounded-full bg-neutral-500" />
        <span className="dot h-1.5 w-1.5 rounded-full bg-neutral-500" />
        <span className="dot h-1.5 w-1.5 rounded-full bg-neutral-500" />
      </div>
    </div>
  );
}

function Banner({ tone, children }: { tone: "warning" | "success"; children: React.ReactNode }) {
  const styles =
    tone === "warning"
      ? "bg-amber-50/80 border-amber-200 text-amber-900"
      : "bg-emerald-50/80 border-emerald-200 text-emerald-900";
  return (
    <div className={`mb-3 rounded-2xl border px-4 py-2.5 text-center text-xs font-medium backdrop-blur ${styles}`}>
      {children}
    </div>
  );
}
