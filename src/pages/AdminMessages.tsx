import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages, useSendMessage, buildThreadId, type MessageRow } from "@/hooks/useMessages";
import { useProfilesByIds } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";

interface ThreadMeta {
  threadId: string;
  userAId: string;
  userBId: string;
  lastMessage: MessageRow;
}

function useAdminThreads() {
  return useQuery({
    queryKey: ["admin-message-threads"],
    queryFn: async (): Promise<ThreadMeta[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const seen = new Set<string>();
      const threads: ThreadMeta[] = [];
      for (const row of data ?? []) {
        if (seen.has(row.thread_id)) continue;
        seen.add(row.thread_id);
        const [a, b] = row.thread_id.split(":");
        threads.push({
          threadId: row.thread_id,
          userAId: a,
          userBId: b,
          lastMessage: {
            id: row.id,
            threadId: row.thread_id,
            senderId: row.sender_id,
            recipientId: row.recipient_id,
            body: row.body,
            readAt: row.read_at,
            createdAt: row.created_at,
          },
        });
      }
      return threads;
    },
  });
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export default function AdminMessages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: threads = [], isLoading } = useAdminThreads();

  const allUserIds = [...new Set(threads.flatMap((t) => [t.userAId, t.userBId]))];
  const { data: profiles = {} } = useProfilesByIds(allUserIds);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  useEffect(() => {
    if (!activeThreadId && threads.length > 0) setActiveThreadId(threads[0].threadId);
  }, [threads, activeThreadId]);

  const activeThread = threads.find((t) => t.threadId === activeThreadId) ?? null;
  const { data: messages = [], isLoading: loadingMessages } = useMessages(activeThreadId ?? undefined);
  const sendMessage = useSendMessage();
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("admin-messages-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        const row = (payload.new ?? payload.old) as { thread_id?: string } | null;
        queryClient.invalidateQueries({ queryKey: ["admin-message-threads"] });
        if (row?.thread_id) queryClient.invalidateQueries({ queryKey: ["messages", row.thread_id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const handleSend = () => {
    if (!newMsg.trim() || !user || !activeThread) return;
    // Admin replies to the non-admin participant (pick the one that isn't admin,
    // or default to userBId)
    const recipientId = activeThread.userAId === user.id ? activeThread.userBId : activeThread.userAId;
    const threadId = buildThreadId(user.id, recipientId);
    sendMessage.mutate({ threadId, senderId: user.id, recipientId, body: newMsg.trim() });
    setNewMsg("");
  };

  const threadLabel = (t: ThreadMeta) => {
    const a = profiles[t.userAId];
    const b = profiles[t.userBId];
    const nameA = a?.fullName || a?.email || t.userAId.slice(0, 6);
    const nameB = b?.fullName || b?.email || t.userBId.slice(0, 6);
    return `${nameA} ↔ ${nameB}`;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-card border-r border-border flex flex-col shrink-0 overflow-y-auto">
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <button
            onClick={() => navigate("/admin-dashboard")}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors mb-3"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </button>
          <h2 className="text-base font-bold">All Conversations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{threads.length} thread{threads.length !== 1 ? "s" : ""}</p>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
        ) : threads.length === 0 ? (
          <EmptyState icon={MessageCircle} title="No conversations yet" description="Messages between homeowners and technicians will appear here." compact />
        ) : (
          threads.map((t) => {
            const label = threadLabel(t);
            const isActive = t.threadId === activeThreadId;
            return (
              <button
                key={t.threadId}
                onClick={() => setActiveThreadId(t.threadId)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border transition-colors",
                  isActive ? "bg-primary/8" : "hover:bg-muted/50"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {initials(label)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{label}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{t.lastMessage.body}</p>
                </div>
              </button>
            );
          })
        )}
      </aside>

      {/* Chat pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState icon={MessageCircle} title="Select a conversation" description="Pick a thread from the left to view the full exchange." />
          </div>
        ) : (
          <>
            <div className="bg-card border-b border-border px-5 py-3">
              <p className="text-sm font-bold">{threadLabel(activeThread)}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 bg-muted/30 space-y-2">
              {loadingMessages ? (
                <Skeleton className="h-16 w-2/3" />
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <EmptyState icon={MessageCircle} title="No messages yet" description="This thread has no messages." />
                </div>
              ) : messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const sender = profiles[msg.senderId];
                const senderName = sender?.fullName || sender?.email || "User";
                const time = new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                return (
                  <div key={msg.id} className={`flex flex-col max-w-[70%] ${isMe ? "self-end items-end ml-auto" : "self-start items-start"}`}>
                    {!isMe && <p className="text-[10px] font-semibold text-muted-foreground mb-0.5 px-1">{senderName}</p>}
                    <div className={`px-3.5 py-2.5 text-[13.5px] leading-relaxed rounded-2xl ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card text-foreground rounded-bl-md border border-border shadow-sm"
                    }`}>
                      {msg.body}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 px-1">{time}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-card border-t border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <Input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Reply as admin…"
                  className="flex-1 rounded-xl border-border bg-muted/50 focus-visible:ring-primary"
                />
                <Button size="icon" onClick={handleSend} disabled={!newMsg.trim() || sendMessage.isPending} className="rounded-xl shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
