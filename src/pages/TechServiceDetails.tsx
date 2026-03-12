import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Clock, Send, CalendarClock, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import TechLayout from "@/components/technician/TechLayout";
import TechRescheduleModal from "@/components/technician/TechRescheduleModal";
import ServiceCompletionModal from "@/components/technician/ServiceCompletionModal";
import {
  createTechServices,
  getHomeowner,
  getPool,
  getPoolFullAddress,
  formatDateFull,
  TIME_LABELS,
  SHORT_MONTHS,
  type TechService,
} from "@/data/techMockData";

interface ChatMsg {
  id: string;
  sender: "tech" | "homeowner";
  text: string;
  time: string;
}

const TechServiceDetails = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [services, setServices] = useState(createTechServices);
  const service = services.find((s) => s.id === serviceId);
  const homeowner = service ? getHomeowner(service.homeownerId) : null;
  const pool = service ? getPool(service.poolId) : null;

  const [showReschedule, setShowReschedule] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (homeowner) {
      setMessages([
        { id: "1", sender: "homeowner", text: "Hi! Is there anything I should know before the visit?", time: "2:27 PM" },
        { id: "2", sender: "tech", text: "Just make sure the gate is accessible and any pool covers are removed. I'll take care of the rest!", time: "4:48 PM" },
        { id: "3", sender: "homeowner", text: "Sounds good, thank you!", time: "4:57 PM" },
      ]);
    }
  }, [homeowner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!service || !homeowner || !pool) {
    return (
      <TechLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Service not found.</p>
          <Button onClick={() => navigate("/tech-dashboard")} className="mt-4">Back to Dashboard</Button>
        </div>
      </TechLayout>
    );
  }

  const isCompleted = service.status === "completed";
  const isInProgress = service.status === "in_progress";

  const handleSend = () => {
    if (!newMsg.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, sender: "tech", text: newMsg.trim(), time: timeStr },
    ]);
    setNewMsg("");
  };

  const handleStartService = () => {
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, status: "in_progress" as const } : s))
    );
  };

  const handleCompleteService = () => {
    setShowCompletion(true);
  };

  const handleCompletionSubmit = () => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? { ...s, status: "completed" as const, completedAt: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) } : s
      )
    );
  };

  const handleReschedule = (newDate: Date, newTime: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? { ...s, date: newDate, timeWindow: newTime as TechService["timeWindow"] } : s
      )
    );
  };

  return (
    <TechLayout>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Service Header */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{service.serviceType}</h1>
            <p className="text-sm text-muted-foreground mt-1">{homeowner.name}</p>
          </div>
          <StatusBadge status={service.status} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span>{getPoolFullAddress(pool)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span>{formatDateFull(service.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span>{TIME_LABELS[service.timeWindow]}</span>
          </div>
        </div>

        {/* Service Actions */}
        {!isCompleted && (
          <div className="flex gap-3 mt-5 pt-5 border-t border-border">
            {!isInProgress ? (
              <Button className="flex-1 gap-1.5" onClick={handleStartService}>
                <Play className="h-4 w-4" />
                Start Service
              </Button>
            ) : (
              <Button className="flex-1 gap-1.5" onClick={handleCompleteService}>
                <CheckCircle2 className="h-4 w-4" />
                Complete Service
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 gap-1.5 hover:text-primary hover:border-primary hover:bg-transparent"
              onClick={() => setShowReschedule(true)}
            >
              <CalendarClock className="h-4 w-4" />
              Reschedule Service
            </Button>
          </div>
        )}
      </div>

      {/* Completed info */}
      {isCompleted && service.completedTasks && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-4">Service Report</h2>
          <div className="space-y-2 mb-4">
            {service.completedTasks.map((task, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{task}</span>
              </div>
            ))}
          </div>
          {service.techNotes && (
            <div className="bg-muted/50 rounded-xl px-4 py-3 mt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{service.techNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <TechRescheduleModal
        open={showReschedule}
        onOpenChange={setShowReschedule}
        currentDate={service.date}
        currentTimeWindow={service.timeWindow}
        homeownerName={homeowner.name}
        onConfirm={handleReschedule}
      />

      <ServiceCompletionModal
        open={showCompletion}
        onOpenChange={setShowCompletion}
        homeownerName={homeowner.name}
        onSubmit={handleCompletionSubmit}
      />
    </TechLayout>
  );
};

export default TechServiceDetails;
