import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Waves, ArrowLeft, Calendar, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useBooking } from "@/contexts/BookingContext";
import poolBefore1 from "@/assets/pool-before-1.jpg";
import poolBefore2 from "@/assets/pool-before-2.jpg";
import poolBefore3 from "@/assets/pool-before-3.jpg";
import poolAfter1 from "@/assets/pool-after-1.jpg";
import poolAfter2 from "@/assets/pool-after-2.jpg";
import poolAfter3 from "@/assets/pool-after-3.jpg";

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM",
};

interface PhotoData {
  src: string;
  alt: string;
  date: string;
  time: string;
}

interface ChatItem {
  id: string;
  type: "text" | "system" | "photos";
  sender?: "user" | "tech" | "automated";
  text?: string;
  time: string;
  date: string;
  photos?: PhotoData[];
}

function formatDate(d: Date): string {
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function buildMessages(techName: string, serviceDate: Date, hours: number): ChatItem[] {
  const svcDate = formatDate(serviceDate);
  const dayBefore = new Date(serviceDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const twoDaysBefore = new Date(serviceDate);
  twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
  const twoDaysBeforeStr = formatDate(twoDaysBefore);
  const dayBeforeStr = formatDate(dayBefore);

  const beforePhotos: PhotoData[] = [
    { src: poolBefore1, alt: "Pool surface with leaves and debris", date: svcDate, time: "10:28 AM" },
    { src: poolBefore2, alt: "Pool walls with algae buildup", date: svcDate, time: "10:30 AM" },
    { src: poolBefore3, alt: "Pool with fallen leaves on surface", date: svcDate, time: "10:32 AM" },
  ];

  const afterPhotos: PhotoData[] = [
    { src: poolAfter1, alt: "Clean pool with crystal clear water", date: svcDate, time: "11:34 AM" },
    { src: poolAfter2, alt: "Spotless pool tile line and steps", date: svcDate, time: "11:36 AM" },
    { src: poolAfter3, alt: "Pristine pool sparkling in sunlight", date: svcDate, time: "11:38 AM" },
  ];

  return [
    { id: "1", type: "text", sender: "tech", text: `Hi! I'm ${techName}, your assigned pool technician. Looking forward to servicing your pool!`, time: "2:24 PM", date: twoDaysBeforeStr },
    { id: "2", type: "text", sender: "user", text: "Hi! Thanks for reaching out. Is there anything I should know before the visit?", time: "2:27 PM", date: twoDaysBeforeStr },
    { id: "3", type: "text", sender: "tech", text: "Just make sure the gate is accessible and any pool covers are removed. I'll take care of the rest!", time: "4:48 PM", date: twoDaysBeforeStr },
    { id: "4", type: "text", sender: "user", text: "Sounds good, thank you!", time: "4:57 PM", date: twoDaysBeforeStr },
    { id: "5", type: "text", sender: "automated", text: `Reminder: Your ${hours}-hour pool service with ${techName} is confirmed for ${svcDate}. View details in your dashboard.`, time: "8:33 AM", date: dayBeforeStr },
    { id: "6", type: "text", sender: "tech", text: "Hi! Just a heads up — I'll be arriving around the scheduled window tomorrow. See you then!", time: "10:15 AM", date: dayBeforeStr },
    { id: "7", type: "text", sender: "user", text: "Perfect, we'll be ready!", time: "10:22 AM", date: dayBeforeStr },
    { id: "8", type: "text", sender: "automated", text: `${techName} is on the way to begin your pool service.`, time: "9:55 AM", date: svcDate },

    // System: service started
    { id: "s1", type: "system", text: "Your pool service has started.", time: "10:00 AM", date: svcDate },

    // Technician: before photos
    { id: "9", type: "text", sender: "tech", text: `Hi, I've started your ${hours}-hour pool service. Here are the before photos.`, time: "10:02 AM", date: svcDate },
    { id: "bp", type: "photos", sender: "tech", photos: beforePhotos, time: "10:03 AM", date: svcDate },

    { id: "10", type: "text", sender: "user", text: "Great, thank you!", time: "10:05 AM", date: svcDate },

    // System: service completed
    { id: "s2", type: "system", text: "Your pool service has been completed.", time: "11:40 AM", date: svcDate },

    // Technician: after photos
    { id: "11", type: "text", sender: "tech", text: "Your pool is all set. Please see the after photos below.", time: "11:42 AM", date: svcDate },
    { id: "ap", type: "photos", sender: "tech", photos: afterPhotos, time: "11:43 AM", date: svcDate },
  ];
}

/* ─── System Status Badge ─── */
const SystemMessage = ({ text, time }: { text: string; time: string }) => (
  <div className="flex flex-col items-center my-3 gap-1">
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
      {text}
    </span>
    <span className="text-[10px] text-muted-foreground">{time}</span>
  </div>
);

/* ─── Photo Grid (inside a bubble) ─── */
const PhotoGrid = ({ photos, onTap }: { photos: PhotoData[]; onTap: (p: PhotoData) => void }) => (
  <div className="grid grid-cols-3 gap-1.5 mt-1">
    {photos.map((p, i) => (
      <button
        key={i}
        onClick={() => onTap(p)}
        className="rounded-xl overflow-hidden border border-border hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer"
      >
        <img src={p.src} alt={p.alt} className="w-full h-[80px] object-cover" loading="lazy" />
      </button>
    ))}
  </div>
);

const Messages = () => {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState("");
  const [items, setItems] = useState<ChatItem[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoData | null>(null);

  const techName = booking?.technician?.isAssigned ? booking.technician.name : "Carlos M.";
  const techInitials = booking?.technician?.isAssigned ? booking.technician.initials : "CM";

  useEffect(() => {
    if (booking) {
      setItems(buildMessages(techName, booking.scheduleData.selectedDate, booking.selectedPass.hours));
    }
  }, [booking]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No active booking found.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const { scheduleData } = booking;
  const d = scheduleData.selectedDate;
  const formattedDate = `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
  const nextServiceLabel = `Next service · ${formattedDate}, ${TIME_LABELS[scheduleData.timeWindow]?.split("–")[0]?.trim() || "Morning"}`;

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setItems((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, type: "text", sender: "user", text: newMessage.trim(), time: timeStr, date: formatDate(now) },
    ]);
    setNewMessage("");
  };

  // Group by date
  const grouped: { date: string; items: ChatItem[] }[] = [];
  items.forEach((item) => {
    const last = grouped[grouped.length - 1];
    if (last && last.date === item.date) {
      last.items.push(item);
    } else {
      grouped.push({ date: item.date, items: [item] });
    }
  });

  // Last tech message for preview
  const lastTechMsg = [...items].reverse().find((i) => i.type === "text" && i.sender === "tech");

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="mx-auto px-5 h-[60px] flex items-center justify-between">
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

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Contacts Sidebar ─── */}
        <aside className="w-[280px] bg-card border-r border-border flex flex-col shrink-0">
          <div className="px-4 pt-5 pb-3">
            <h2 className="text-lg font-bold text-foreground">Messages</h2>
          </div>

          {/* Contact Item — Carlos M. (active) */}
          <button className="w-full flex items-center gap-3 px-4 py-3 text-left bg-primary/8 border-b border-border transition-colors hover:bg-primary/12 cursor-pointer">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
              {techInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{techName}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {lastTechMsg?.text || nextServiceLabel}
              </p>
              
            </div>
          </button>

          {/* Future contacts render here — divider ready */}
        </aside>

        {/* ─── Chat Thread ─── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-card border-b border-border px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                {techInitials}
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">{techName}</p>
                
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => navigate(-1)}
            >
              <Calendar className="h-3.5 w-3.5" />
              View appointment
            </Button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-5 py-5 bg-muted/30 space-y-1">
            {grouped.map((group) => (
              <div key={group.date}>
                <div className="text-center my-3">
                  <span className="text-xs text-muted-foreground font-medium bg-background px-3 py-1 rounded-full border border-border">
                    {group.date}
                  </span>
                </div>

                {group.items.map((item) => {
                  if (item.type === "system") {
                    return <SystemMessage key={item.id} text={item.text!} time={item.time} />;
                  }
                  if (item.type === "photos") {
                    return (
                      <div key={item.id} className="flex flex-col mb-1 max-w-[75%] self-start items-start">
                        <div className="bg-card rounded-2xl rounded-bl-md border border-border shadow-sm p-2">
                          <PhotoGrid photos={item.photos!} onTap={setLightboxPhoto} />
                        </div>
                        <span className="text-[11px] text-muted-foreground mt-0.5 px-1">{item.time}</span>
                      </div>
                    );
                  }
                  const isUser = item.sender === "user";
                  const isAuto = item.sender === "automated";
                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col mb-1 max-w-[70%] ${
                        isUser ? "self-end items-end ml-auto" : "self-start items-start"
                      }`}
                    >
                      <div
                        className={`px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                          isUser
                            ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                            : isAuto
                            ? "bg-muted text-muted-foreground rounded-2xl rounded-bl-md text-[12.5px]"
                            : "bg-card text-foreground rounded-2xl rounded-bl-md border border-border shadow-sm"
                        }`}
                      >
                        {item.text}
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-0.5 px-1">{item.time}</span>
                    </div>
                  );
                })}
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

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
            <DialogTitle className="sr-only">Photo</DialogTitle>
            <img src={lightboxPhoto.src} alt={lightboxPhoto.alt} className="w-full max-h-[400px] object-cover" />
            <div className="px-5 py-3 pb-5">
              <p className="text-xs text-muted-foreground">{lightboxPhoto.date} at {lightboxPhoto.time}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Messages;
