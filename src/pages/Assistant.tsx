import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { labels } from "@/lib/kinyarwanda";
import {
  answerShopQuestion,
  type AssistantMessage,
} from "@/lib/shopAssistant";
import { hapticLight } from "@/lib/haptics";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Amafaranga yinjiye uyu munsi?",
  "Bande bafite ideni?",
  "Hari icyo cyashize mu bubiko?",
  "Ni gute nagurisha?",
];

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: labels.assistantWelcome,
      at: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    void hapticLight();
    setInput("");
    const userMsg: AssistantMessage = {
      id: newId(),
      role: "user",
      text: q,
      at: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    try {
      const reply = await answerShopQuestion(q);
      setMessages((m) => [
        ...m,
        { id: newId(), role: "assistant", text: reply, at: Date.now() },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sella-page flex flex-col min-h-[100dvh]">
      <PageHeader
        title={labels.assistantTitle}
        subtitle={labels.assistantSubtitle}
      />

      <div className="flex-1 sella-page-body flex flex-col pb-28">
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => void ask(s)}
              className="text-[11px] font-medium rounded-full border border-border/80 dark:border-white/10 bg-white/70 dark:bg-white/10 px-3 py-1.5 text-foreground backdrop-blur-md active:scale-[0.98] disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-white/80 dark:bg-white/10 border border-border/80 dark:border-white/10 text-foreground rounded-bl-md shadow-sm backdrop-blur-md"
                )}
              >
                {m.role === "assistant" && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary mb-1">
                    <Sparkles size={12} />
                    ChatSella
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {busy && (
            <p className="text-xs text-muted-foreground px-1">
              {labels.assistantThinking}
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        className="fixed inset-x-0 z-40 mx-auto max-w-lg border-t border-border/70 dark:border-white/10 bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl px-3 py-3"
        style={{
          bottom: "calc(3.75rem + env(safe-area-inset-bottom))",
        }}
        onSubmit={(e) => {
          e.preventDefault();
          void ask(input);
        }}
      >
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            placeholder={labels.assistantPlaceholder}
            className="flex-1 resize-none rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 max-h-28"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void ask(input);
              }
            }}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 shrink-0"
            aria-label={labels.assistantSend}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
