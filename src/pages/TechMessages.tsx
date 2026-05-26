import { useState, useRef, useEffect, useMemo } from "react";
import { Send, MessageCircle, MessageSquarePlus } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import TechLayout from "@/components/technician/TechLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useServices } from "@/hooks/useServices";
import { useProfilesByIds } from "@/hooks/useProfiles";
import { useMessages, useSendMessage, buildThreadId } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

const TechMessages = () => {
  const { user } = useAuth();
  const { data: services = [], isLoading: loadingServices } = useServices({ technicianId: user?.id });

  const homeownerIds = useMemo(() => [...new Set(services.map((s) => s.homeownerId))], [services]);
  const { data: profiles = {}, isLoading: loadingProfiles } = useProfilesByIds(homeownerIds);
  const homeowners = homeownerIds.map((id) => profiles[id]).filter(Boolean);

  const [selectedHoId, setSelectedHoId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedHoId && homeowners.length > 0) setSelectedHoId(homeowners[0].id);
  }, [homeowners, selectedHoId]);

  const threadId = user && selectedHoId ? buildThreadId(user.id, selectedHoId) : undefined;
  const { data: messages = [], isLoading: loadingMessages } = useMessages(threadId);
  const sendMessage = useSendMessage();

  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedHoId]);

  const selectedHomeowner = homeowners.find((h) => h.id === selectedHoId);

  const handleSend = () => {
    if (!newMsg.trim() || !user || !selectedHoId || !threadId) return;
    sendMessage.mutate({
      threadId,
      senderId: user.id,
      recipientId: selectedHoId,
      body: newMsg.trim(),
    });
    setNewMsg("");
  };

  const isLoading = loadingServices || loadingProfiles;

  return (
    <TechLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Messages</h1>

      {isLoading ? (
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      ) : homeowners.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center border border-border">
          <p className="text-muted-foreground">No homeowner conversations yet.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex" style={{ height: "500px" }}>
          {/* Contacts */}
          <aside className="w-[220px] border-r border-border flex flex-col shrink-0 overflow-y-auto">
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Homeowners</p>
            </div>
            {homeowners.map((ho) => (
              <button
                key={ho.id}
                onClick={() => setSelectedHoId(ho.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border transition-colors",
                  selectedHoId === ho.id ? "bg-primary/8" : "hover:bg-muted/50"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {ho.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{ho.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{ho.email}</p>
                </div>
              </button>
            ))}
          </aside>

          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <p className="text-[15px] font-bold text-foreground">{selectedHomeowner?.fullName || "Select a contact"}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 bg-muted/30 space-y-2">
              {loadingMessages ? (
                <Skeleton className="h-16 w-2/3" />
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isTech = msg.senderId === user?.id;
                  const time = new Date(msg.createdAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[75%] ${isTech ? "self-end items-end ml-auto" : "self-start items-start"}`}
                    >
                      <div
                        className={`px-3.5 py-2.5 text-[13.5px] leading-relaxed rounded-2xl ${
                          isTech
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-card text-foreground rounded-bl-md border border-border shadow-sm"
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

            <div className="px-5 py-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Input
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`Message ${selectedHomeowner?.fullName || ""}...`}
                  className="flex-1 rounded-xl border-border bg-muted/50 focus-visible:ring-primary"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!newMsg.trim() || sendMessage.isPending}
                  className="rounded-xl shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </TechLayout>
  );
};

export default TechMessages;
