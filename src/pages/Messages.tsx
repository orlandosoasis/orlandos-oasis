import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMessageThreads,
  useMessages,
  useSendMessage,
} from "@/hooks/useMessages";
import { useProfilesByIds } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";

const Messages = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: threads = [], isLoading: loadingThreads } = useMessageThreads(user?.id);
  const otherIds = useMemo(() => threads.map((t) => t.otherUserId), [threads]);
  const { data: profiles = {} } = useProfilesByIds(otherIds);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const activeThread = threads.find((t) => t.threadId === activeThreadId) || null;

  useEffect(() => {
    if (!activeThreadId && threads.length > 0) {
      setActiveThreadId(threads[0].threadId);
    }
  }, [threads, activeThreadId]);

  const { data: messages = [], isLoading: loadingMessages } = useMessages(activeThreadId ?? undefined);
  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Realtime: refresh threads + active messages on any change
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { thread_id?: string } | null;
          queryClient.invalidateQueries({ queryKey: ["message-threads", user.id] });
          if (row?.thread_id) {
            queryClient.invalidateQueries({ queryKey: ["messages", row.thread_id] });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Please sign in to view your messages.</p>
        <Button onClick={() => navigate("/login")}>Sign in</Button>
      </div>
    );
  }

  const handleSend = () => {
    if (!newMessage.trim() || !user || !activeThread) return;
    sendMessage.mutate({
      threadId: activeThread.threadId,
      senderId: user.id,
      recipientId: activeThread.otherUserId,
      body: newMessage.trim(),
    });
    setNewMessage("");
  };

  const otherProfile = activeThread ? profiles[activeThread.otherUserId] : undefined;
  const otherName = otherProfile?.fullName || otherProfile?.email || "Conversation";
  const otherInitials = otherName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col flex-1" style={{ height: "calc(100vh - 60px)" }}>
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Contacts Sidebar ─── */}
        <aside className="w-[280px] bg-card border-r border-border flex flex-col shrink-0 overflow-y-auto">
          <div className="px-4 pt-5 pb-3">
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
          </div>

          {loadingThreads ? (
            <div className="px-4 space-y-3">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : threads.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            threads.map((t) => {
              const p = profiles[t.otherUserId];
              const name = p?.fullName || p?.email || "Conversation";
              const initials = name
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();
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
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                    {initials || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {t.lastMessage.body}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* ─── Chat Thread ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-card border-b border-border px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                {otherInitials || "?"}
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">{otherName}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 bg-muted/30 space-y-1">
            {loadingMessages ? (
              <Skeleton className="h-16 w-2/3" />
            ) : !activeThread ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Select a conversation to begin.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                const time = new Date(msg.createdAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col mb-1 max-w-[70%] ${
                      isMe ? "self-end items-end ml-auto" : "self-start items-start"
                    }`}
                  >
                    <div
                      className={`px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                          : "bg-card text-foreground rounded-2xl rounded-bl-md border border-border shadow-sm"
                      }`}
                    >
                      {msg.body}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 px-1">{time}</span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-card border-t border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={activeThread ? `Message ${otherName}...` : "Select a conversation"}
                disabled={!activeThread}
                className="flex-1 rounded-xl border-border bg-muted/50 focus-visible:ring-primary"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!newMessage.trim() || !activeThread || sendMessage.isPending}
                className="rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
