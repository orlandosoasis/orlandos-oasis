import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Clock, Send, CalendarClock, Play, CheckCircle2, MessagesSquare, Camera, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import TechLayout from "@/components/technician/TechLayout";
import TechRescheduleModal from "@/components/technician/TechRescheduleModal";
import ServiceCompletionModal from "@/components/technician/ServiceCompletionModal";
import ReportRouteIssueModal, { type RouteService } from "@/components/ReportRouteIssueModal";
import {
  createTechServices,
  getHomeowner,
  getPool,
  getPoolFullAddress,
  formatDateFull,
  TIME_LABELS,
  SHORT_MONTHS,
  type TechService,
  SERVICE_TASKS,
} from "@/data/techMockData";
import poolBefore1 from "@/assets/pool-before-1.jpg";
import poolBefore2 from "@/assets/pool-before-2.jpg";
import poolBefore3 from "@/assets/pool-before-3.jpg";
import poolAfter1 from "@/assets/pool-after-1.jpg";
import poolAfter2 from "@/assets/pool-after-2.jpg";
import poolAfter3 from "@/assets/pool-after-3.jpg";

const BEFORE_PHOTOS = [
  { id: "b1", src: poolBefore1, alt: "Pool before cleaning" },
  { id: "b2", src: poolBefore2, alt: "Pool before cleaning" },
  { id: "b3", src: poolBefore3, alt: "Pool before cleaning" },
];

const AFTER_PHOTOS = [
  { id: "a1", src: poolAfter1, alt: "Pool after cleaning" },
  { id: "a2", src: poolAfter2, alt: "Pool after cleaning" },
  { id: "a3", src: poolAfter3, alt: "Pool after cleaning" },
];

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
  const [showReportIssue, setShowReportIssue] = useState(false);
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
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setServices((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, status: "in_progress" as const, startedAt: timeStr } : s))
    );
  };

  const handleCompleteService = () => {
    setShowCompletion(true);
  };

  const handleCompletionSubmit = (data: { beforePhotos: File[]; afterPhotos: File[]; completedTasks: string[]; notes: string }) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === service.id ? {
          ...s,
          status: "completed" as const,
          completedAt: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
          completedTasks: data.completedTasks,
          techNotes: data.notes || undefined,
        } : s
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
            <h1 className="text-xl font-bold text-foreground">{homeowner.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{service.serviceType}</p>
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
              onClick={() => navigate("/tech/messages")}
            >
              <MessagesSquare className="h-4 w-4" />
              Message
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1.5 hover:text-primary hover:border-primary hover:bg-transparent"
              onClick={() => setShowReschedule(true)}
            >
              <CalendarClock className="h-4 w-4" />
              Reschedule
            </Button>
          </div>
        )}
        {!isCompleted && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() => setShowReportIssue(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              Report an issue with this job
            </button>
          </div>
        )}
      </div>

      {/* Completed info */}
      {isCompleted && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-4">Service Report</h2>

          {/* Service Times */}
          {(service.startedAt || service.completedAt) && (
            <div className="space-y-1.5 mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Play className="h-4 w-4 text-accent shrink-0" />
                <span>Start Time: {service.startedAt || service.completedAt}</span>
              </div>
              {service.completedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-accent shrink-0" />
                  <span>Completion Time: {service.completedAt}</span>
                </div>
              )}
            </div>
          )}

          {/* Before Photos */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Before Photos</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {BEFORE_PHOTOS.map((photo) => (
                <div key={photo.id} className="rounded-xl overflow-hidden border border-border">
                  <img src={photo.src} alt={photo.alt} className="h-[110px] w-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border my-4" />

          {/* After Photos */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">After Photos</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {AFTER_PHOTOS.map((photo) => (
                <div key={photo.id} className="rounded-xl overflow-hidden border border-border">
                  <img src={photo.src} alt={photo.alt} className="h-[110px] w-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border my-4" />

          {/* Completed Tasks */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Completed Tasks</span>
            </div>
            <div className="space-y-2 mb-4">
              {(service.completedTasks && service.completedTasks.length > 0
                ? service.completedTasks
                : SERVICE_TASKS
              ).map((task, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{task}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technician Notes */}
          <div className="border-t border-border my-4" />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Other Notes</span>
            </div>
            <div className="bg-muted/50 rounded-xl px-4 py-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.techNotes || "Skimmer basket was heavily filled with leaves. Adjusted chlorine slightly due to recent rain. Filter pressure normal. Recommend checking again next visit if weather continues."}
              </p>
            </div>
          </div>
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

      <ReportRouteIssueModal
        open={showReportIssue}
        onOpenChange={setShowReportIssue}
        role="technician"
        services={[
          {
            id: service.id,
            homeowner: homeowner.name,
            type: service.serviceType,
            time: TIME_LABELS[service.timeWindow],
          } as RouteService,
        ]}
        lockedServiceId={service.id}
      />
    </TechLayout>
  );
};

export default TechServiceDetails;
