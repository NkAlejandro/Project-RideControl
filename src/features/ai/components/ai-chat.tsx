import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type AIMessage,
  chatStream,
  getWelcomeMessage,
} from "@/lib/ai-service";

export default function AIChat() {
  const [messages, setMessages] = useState<AIMessage[]>([getWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    setInput("");
    setError(null);

    const userMsg: AIMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setStreaming(true);

    try {
      let accumulated = "";
      const generator = chatStream(updatedMessages);
      let hasContent = false;

      for await (const chunk of generator) {
        accumulated += chunk;
        hasContent = true;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && !last.tool_calls) {
            return [...prev.slice(0, -1), { ...last, content: accumulated }];
          }
          return [...prev, { role: "assistant", content: accumulated }];
        });
      }

      if (!hasContent) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.content) {
            return prev;
          }
          return [...prev, { role: "assistant", content: "No estoy seguro de cómo responder a eso. ¿Podrías darme más detalles?" }];
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Error: ${msg}` },
      ]);
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-3 max-h-[400px] min-h-[300px] space-y-3 overflow-y-auto rounded-2xl border border-theme-subtle bg-card p-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.role === "system") return null;
            const isUser = msg.role === "user";
            const isTool = msg.role === "tool";
            if (isTool && !msg.content?.startsWith("Error")) return null;

            return (
              <motion.div
                key={`${i}-${msg.content?.slice(0, 20)}`}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}
              >
                {!isUser && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
                    <Bot className="h-3.5 w-3.5 text-primary-500" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                    isUser
                      ? "bg-primary-500 text-white"
                      : msg.content?.startsWith("❌")
                        ? "bg-danger-500/10 text-danger-400"
                        : "bg-hover text-primary-color",
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                    {i === messages.length - 1 && streaming && isUser === false && (
                      <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-primary-500 align-text-bottom" />
                    )}
                  </div>
                </div>
                {isUser && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-500">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {error && <p className="mb-2 text-[10px] text-danger-500">{error}</p>}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          disabled={streaming}
          className="flex h-10 flex-1 rounded-xl border border-theme-subtle bg-card px-3.5 text-xs text-primary-color placeholder:text-muted-color focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/20 disabled:opacity-50"
        />
        <Button
          size="sm"
          onClick={sendMessage}
          disabled={!input.trim() || streaming}
          className="shrink-0"
        >
          {streaming ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
