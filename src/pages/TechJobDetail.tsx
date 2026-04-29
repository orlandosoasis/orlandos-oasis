import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Circle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import StatusBadge from "@/components/StatusBadge";
import TechLayout from "@/components/technician/TechLayout";
import {
  getHomeowner,
  getPool,
  getPoolFullAddress,
  formatDateFull,
  TIME_LABELS,
} from "@/data/techMockData";
import {
  getJobs,
  subscribe,
  setJobStatus,
  getJobPhotos,
  addJobPhoto,
  type JobPhoto,
} from "@/data/techJobsStore";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type ChatMsg =
  | { id: string; sender: "tech" | "homeowner"; kind: "text"; text: string; time: string }
  | { id: string; sender: "tech"; kind: "photo"; photoType: "before" | "after"; src: string; time: string };

const TechJobDetail = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  const service = getJobs().find((s) => s.id === serviceId);
  const homeowner = service ? getHomeowner(service.homeownerId) : null;
  const pool = service ? getPool(service.poolId) : null;

  const photos = service ? getJobPhotos(service.id) : [];
  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Seed thread + autofocus on first load
  useEffect(() => {
    if (!homeowner) return;
    setMessages([
      { id: "1", sender: "homeowner", kind: "text", text: "Hi! Anything I should know before the visit?", time: "2:27 PM" },
      { id: "2", sender: "tech", kind: "text", text: "Just make sure the gate is accessible. I'll handle the rest!", time: "4:48 PM" },
    ]);
    setTimeout(() => inputRef.current?.focus(), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeowner?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mirror photos from store into the chat as photo messages
  const seenPhotoIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    const newOnes = photos.filter((p) => !seenPhotoIds.current.has(p.id));
    if (newOnes.length === 0) return;
    newOnes.forEach((p) => seenPhotoIds.current.add(p.id));
    setMessages((prev) => [
      ...prev,
      ...newOnes.map<ChatMsg>((p) => ({
        id: `photo-${p.id}`,
        sender: "tech",
        kind: "photo",
        photoType: p.type,
        src: p.src,
        time: p.time,
      })),
    ]);
  }, [photos]);

  const canComplete = beforePhotos.length >= 1 && afterPhotos.length >= 1;

  if (!service || !homeowner || !pool) {
    return (
      <TechLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Job not found.</p>
          <Button onClick={() => navigate("/tech/jobs")} className="mt-4">Back to Jobs</Button>
        </div>
      </TechLayout>
    );
  }

  // Auto-mark in_progress on entry if still scheduled
  if (service.status === "scheduled") {
    const now = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setJobStatus(service.id, "in_progress", { startedAt: now });
  }

  const handleSend = () => {
    if (!newMsg.trim()) return;
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setMessages((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, sender: "tech", kind: "text", text: newMsg.trim(), time },
    ]);
    setNewMsg("");
  };

  const handleFiles = (files: FileList | null, type: "before" | "after") => {
    if (!files || files.length === 0) return;
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    Array.from(files).forEach((file) => {
      const src = URL.createObjectURL(file);
      const photo: JobPhoto = { id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, src, type, time };
      addJobPhoto(service.id, photo);
    });
    toast({
      title: type === "before" ? "Before photos uploaded" : "After photos uploaded",
      description: `${files.length} photo${files.length > 1 ? "s" : ""} added to the thread.`,
    });
  };

  const handleConfirmComplete = () => {
    setCompleting(true);
    setTimeout(() => {
      const completedAt = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      setJobStatus(service.id, "completed", { completedAt });
      setCompleting(false);
      setConfirmOpen(false);
      navigate("/tech/jobs", {
        state: {
          completedBanner: {
            homeownerName: homeowner.name,
            completedAt,
          },
        },
      });
    }, 400);
  };

  return (
    <TechLayout>
      <button
        onClick={() => navigate("/tech/jobs")}
        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back to Jobs</span>
      </button>

      {/* Header */}
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
      </div>

      {/* Progress checklist */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-4">
        <h2 className="text-[15px] font-bold text-foreground mb-4">Progress Checklist</h2>
        <div className="space-y-3">
          <ChecklistRow done={beforePhotos.length >= 1} label="Before Photos Uploaded" sub={`${beforePhotos.length} uploaded`} />
          <ChecklistRow done={service.status === "in_progress" || service.status === "completed"} label="Service In Progress" sub="Auto-checked after Start" />
          <ChecklistRow done={afterPhotos.length >= 1} label="After Photos Uploaded" sub={`${afterPhotos.length} uploaded`} />
        </div>
      </div>

      {/* Messages section */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-24">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="text-[15px] font-bold text-foreground">Chat with {homeowner.name}</p>
          <span className="text-xs text-muted-foreground">Photos here count toward the checklist</span>
        </div>

        {/* Quick actions */}
        <div className="px-4 py-3 border-b border-border flex flex-wrap gap-2 bg-muted/30">
          <input
            ref={beforeInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files, "before");
              if (beforeInputRef.current) beforeInputRef.current.value = "";
            }}
          />
          <input
            ref={afterInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files, "after");
              if (afterInputRef.current) afterInputRef.current.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 hover:text-primary hover:border-primary hover:bg-transparent"
            onClick={() => beforeInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" /> Upload Before Photos
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 hover:text-primary hover:border-primary hover:bg-transparent"
            onClick={() => afterInputRef.current?.click()}
          >
            <Camera className="h-4 w-4" /> Upload After Photos
          </Button>
        </div>

        {/* Thread */}
        <div className="px-5 py-4 bg-muted/30 space-y-2 max-h-[420px] overflow-y-auto">
          {messages.map((msg) => {
            const isTech = msg.sender === "tech";
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[75%] ${isTech ? "self-end items-end ml-auto" : "self-start items-start"}`}
              >
                {msg.kind === "text" ? (
                  <div
                    className={`px-3.5 py-2.5 text-[13.5px] leading-relaxed rounded-2xl ${
                      isTech
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card text-foreground rounded-bl-md border border-border shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
                    <img src={msg.src} alt={`${msg.photoType} photo`} className="h-40 w-40 object-cover" />
                    <div className="px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <ImageIcon className="h-3 w-3" />
                      <span className="capitalize">{msg.photoType} photo</span>
                    </div>
                  </div>
                )}
                <span className="text-[11px] text-muted-foreground mt-0.5 px-1">{msg.time}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-5 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={`Message ${homeowner.name}...`}
              className="flex-1 rounded-xl border-border bg-muted/50 focus-visible:ring-primary"
            />
            <Button size="icon" onClick={handleSend} disabled={!newMsg.trim()} className="rounded-xl shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[220px] z-20 bg-card/95 backdrop-blur border-t border-border">
        <div className="max-w-[860px] mx-auto px-5 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs", canComplete ? "text-card-foreground" : "text-muted-foreground")}>
              {canComplete
                ? "All requirements met — ready to complete."
                : "Upload before & after photos to complete service"}
            </p>
          </div>
          <Button
            className="gap-1.5 shrink-0"
            disabled={!canComplete}
            onClick={() => setConfirmOpen(true)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete Service
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark this service as complete?</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm that all tasks are done and before/after photos are uploaded.
              The homeowner will be notified and the job will move to your Completed list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmComplete} disabled={completing} className="gap-1.5">
              {completing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Completing…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Yes, complete service
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TechLayout>
  );
};

const ChecklistRow = ({ done, label, sub }: { done: boolean; label: string; sub?: string }) => (
  <div className="flex items-start gap-3">
    {done ? (
      <CheckCircle2 className="h-5 w-5 text-card-foreground shrink-0 mt-0.5" />
    ) : (
      <Circle className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
    )}
    <div className="flex-1">
      <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  </div>
);

export default TechJobDetail;
