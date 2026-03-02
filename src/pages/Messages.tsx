import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, ArrowLeft, Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBooking } from "@/contexts/BookingContext";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM",
};

interface Message {
  id: string;
  text: string;
  sender: "user" | "tech" | "automated";
  time: string;
  date: string;
}

function formatDate(d: Date): string {
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function buildMockMessages(techName: string, serviceDate: Date, hours: number): Message[] {
  const svcDate = formatDate(serviceDate);
  const dayBefore = new Date(serviceDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const twoDaysBefore = new Date(serviceDate);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);

  return [
    { id: "1", text: `Hi! I'm ${techName}, your assigned pool technician. Looking forward to servicing your pool!`, sender: "tech", time: "2:24 PM", date: formatDate(twoDaysBefore) },
    { id: "2", text: "Hi! Thanks for reaching out. Is there anything I should know before the visit?", sender: "user", time: "2:27 PM", date: formatDate(twoDaysBefore) },
    { id: "3", text: "Just make sure the gate is accessible and any pool covers are removed. I'll take care of the rest!", sender: "tech", time: "4:48 PM", date: formatDate(twoDaysBefore) },
    { id: "4", text: "Sounds good, thank you!", sender: "user", time: "4:57 PM", date: formatDate(twoDaysBefore) },
    { id: "5", text: `Reminder: Your ${hours}-hour pool service with ${techName} is confirmed for ${svcDate}. View details in your dashboard.`, sender: "automated", time: "8:33 AM", date: formatDate(dayBefore) },
    { id: "6", text: `Hi! Just a heads up — I'll be arriving around the scheduled window tomorrow. See you then!`, sender: "tech", time: "10:15 AM", date: formatDate(dayBefore) },
    { id: "7", text: "Perfect, we'll be ready!", sender: "user", time: "10:22 AM", date: formatDate(dayBefore) },
    { id: "8", text: `${techName} is on the way to begin your pool service.`, sender: "automated", time: "9:55 AM", date: svcDate },
    { id: "9", text: "I'm here — starting the service now.", sender: "tech", time: "10:02 AM", date: svcDate },
    { id: "10", text: "Great, thank you!", sender: "user", time: "10:05 AM", date: svcDate },
    { id: "11", text: "All done! Skimmer basket was full of leaves so I gave it an extra clean. Chemicals are balanced. Your pool is looking great! 🏊", sender: "tech", time: "11:42 AM", date: svcDate },
  ];
}

const Messages = () => {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const techName = booking?.technician?.isAssigned ? booking.technician.name : "Carlos M.";
  const techInitials = booking?.technician?.isAssigned ? booking.technician.initials : "CM";

  useEffect(() => {
    if (booking) {
      setMessages(buildMockMessages(techName, booking.scheduleData.selectedDate, booking.selectedPass.hours));
    }
  }, [booking]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No active booking found.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const { selectedPass, scheduleData } = booking;
  const d = scheduleData.selectedDate;
  const formattedDate = `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
  const nextServiceLabel = `Next service · ${formattedDate}, ${TIME_LABELS[scheduleData.timeWindow]?.split("–")[0]?.trim() || "Morning"}`;

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, text: newMessage.trim(), sender: "user", time: timeStr, date: formatDate(now) },
    ]);
    setNewMessage("");
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === msg.date) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date: msg.date, msgs: [msg] });
    }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-1.5">
            <Waves className="h-5 w-5 text-primary" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex flex-1 overflow-hidden max-w-[760px] mx-auto w-full">
        {/* Main Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-card border-b border-border px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                {techInitials}
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">{techName}</p>
                <p className="text-xs text-muted-foreground">{nextServiceLabel}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs hover:bg-primary hover:text-primary-foreground hover:border-primary"
              onClick={() => navigate(-1)}
            >
              <Calendar className="h-3.5 w-3.5" />
              View appointment
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-5 py-5 bg-muted/30 space-y-1">
            {groupedMessages.map((group) => (
              <div key={group.date}>
                {/* Date Divider */}
                <div className="text-center my-3">
                  <span className="text-xs text-muted-foreground font-medium bg-background px-3 py-1 rounded-full border border-border">
                    {group.date}
                  </span>
                </div>

                {/* Messages in group */}
                {group.msgs.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col mb-1 max-w-[70%] ${
                      msg.sender === "user" ? "self-end items-end ml-auto" : "self-start items-start"
                    }`}
                  >
                    <div
                      className={`px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                          : msg.sender === "automated"
                          ? "bg-muted text-muted-foreground rounded-2xl rounded-bl-md text-[12.5px]"
                          : "bg-card text-foreground rounded-2xl rounded-bl-md border border-border shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-0.5 px-1">{msg.time}</span>
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-card border-t border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={`Message ${techName}...`}
                className="flex-1 rounded-xl border-border bg-muted/50 focus-visible:ring-primary"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!newMessage.trim()}
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
