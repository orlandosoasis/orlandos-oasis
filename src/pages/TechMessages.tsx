import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TechLayout from "@/components/technician/TechLayout";
import { HOMEOWNERS } from "@/data/techMockData";
import { cn } from "@/lib/utils";

interface ChatMsg {
  id: string;
  sender: "tech" | "homeowner";
  text: string;
  time: string;
}

const MOCK_THREADS: Record<string, ChatMsg[]> = {
  "ho-1": [
    { id: "1", sender: "homeowner", text: "Hi! Is there anything I should know before the visit?", time: "2:27 PM" },
    { id: "2", sender: "tech", text: "Just make sure the gate is accessible. I'll handle the rest!", time: "4:48 PM" },
    { id: "3", sender: "homeowner", text: "Sounds good, thank you!", time: "4:57 PM" },
  ],
  "ho-2": [
    { id: "1", sender: "homeowner", text: "Can you check the salt cell this time?", time: "10:15 AM" },
    { id: "2", sender: "tech", text: "Absolutely, I'll make sure to inspect it thoroughly.", time: "10:22 AM" },
  ],
  "ho-3": [
    { id: "1", sender: "homeowner", text: "The key is under the flowerpot by the back door.", time: "9:00 AM" },
  ],
};

const TechMessages = () => {
  const navigate = useNavigate();
  const [selectedHo, setSelectedHo] = useState(HOMEOWNERS[0].id);
  const [threads, setThreads] = useState(MOCK_THREADS);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedHomeowner = HOMEOWNERS.find((h) => h.id === selectedHo);
  const currentMessages = threads[selectedHo] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, selectedHo]);

  const handleSend = () => {
    if (!newMsg.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setThreads((prev) => ({
      ...prev,
      [selectedHo]: [
        ...(prev[selectedHo] || []),
        { id: `msg-${Date.now()}`, sender: "tech" as const, text: newMsg.trim(), time: timeStr },
      ],
    }));
    setNewMsg("");
  };

  return (
    <TechLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Messages</h1>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex" style={{ height: "500px" }}>
        {/* Contacts */}
        <aside className="w-[220px] border-r border-border flex flex-col shrink-0">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Homeowners</p>
          </div>
          {HOMEOWNERS.map((ho) => {
            const lastMsg = (threads[ho.id] || []).slice(-1)[0];
            return (
              <button
                key={ho.id}
                onClick={() => setSelectedHo(ho.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left border-b border-border transition-colors",
                  selectedHo === ho.id ? "bg-primary/8" : "hover:bg-muted/50"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {ho.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{ho.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{lastMsg?.text || "No messages"}</p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-[15px] font-bold text-foreground">{selectedHomeowner?.name}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 bg-muted/30 space-y-2">
            {currentMessages.map((msg) => {
              const isTech = msg.sender === "tech";
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
                    {msg.text}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-0.5 px-1">{msg.time}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-5 py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`Message ${selectedHomeowner?.name}...`}
                className="flex-1 rounded-xl border-border bg-muted/50 focus-visible:ring-primary"
              />
              <Button size="icon" onClick={handleSend} disabled={!newMsg.trim()} className="rounded-xl shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </TechLayout>
  );
};

export default TechMessages;
