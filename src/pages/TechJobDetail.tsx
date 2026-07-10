import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useUploadServicePhoto } from "@/hooks/useServicePhotos";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  Camera,
  Circle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { supabase } from "@/integrations/supabase/client";
import { useService } from "@/hooks/useServices";
import { usePool } from "@/hooks/usePools";
import { useProfile } from "@/hooks/useProfiles";
import { useMessages, useSendMessage, buildThreadId } from "@/hooks/useMessages";
import {
  getPoolFullAddress,
  formatDateFull,
  TIME_LABELS,
} from "@/types/tech";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type LocalPhoto = { id: string; src: string; type: "before" | "after"; time: string };

const TechJobDetail = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: service, isLoading } = useService(serviceId);
  const { data: pool } = usePool(service?.poolId);
  const { data: homeowner } = useProfile(service?.homeownerId);
  const homeownerName = homeowner?.fullName || homeowner?.email || "Homeowner";

  const { user } = useAuth();
  const uploadPhoto = useUploadServicePhoto();

  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [beforeFiles, setBeforeFiles] = useState<File[]>([]);
  const [afterFiles, setAfterFiles] = useState<File[]>([]);
  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");

  const threadId = user && service?.homeownerId ? buildThreadId(user.id, service.homeownerId) : undefined;
  const { data: dbMessages = [] } = useMessages(threadId);
  const sendMessage = useSendMessage();
  const [newMsg, setNewMsg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus input on load
  useEffect(() => {
    if (!homeowner) return;
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [homeowner?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dbMessages]);

  // Auto-mark in_progress on entry if still scheduled
  useEffect(() => {
    if (!service || service.status !== "scheduled") return;
    supabase
      .from("services")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", service.id)
      .then(() => queryClient.invalidateQueries({ queryKey: ["services"] }));
  }, [service?.id, service?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const canComplete = beforePhotos.length >= 1 && afterPhotos.length >= 1;

  if (isLoading) {
    return (
      <TechLayout>
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-44 rounded-2xl mb-4" />
        <Skeleton className="h-32 rounded-2xl mb-4" />
        <Skeleton className="h-96 rounded-2xl" />
      </TechLayout>
    );
  }

  if (!service || !pool) {
    return (
      <TechLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Job not found.</p>
          <Button onClick={() => navigate("/tech/jobs")} className="mt-4">Back to Jobs</Button>
        </div>
      </TechLayout>
    );
  }

  const handleSend = () => {
    if (!newMsg.trim() || !user || !service?.homeownerId || !threadId) return;
    sendMessage.mutate({
      threadId,
      senderId: user.id,
      recipientId: service.homeownerId,
      body: newMsg.trim(),
    });
    setNewMsg("");
  };

  const handleFiles = (files: FileList | null, type: "before" | "after") => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const newPhotos: LocalPhoto[] = fileArray.map((file) => ({
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      src: URL.createObjectURL(file),
      type,
      time,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    if (type === "before") {
      setBeforeFiles((prev) => [...prev, ...fileArray]);
    } else {
      setAfterFiles((prev) => [...prev, ...fileArray]);
    }
    toast({
      title: type === "before" ? "Before photos uploaded" : "After photos uploaded",
      description: `${files.length} photo${files.length > 1 ? "s" : ""} added to the thread.`,
    });
  };

  const handleConfirmComplete = async () => {
    setCompleting(true);
    const completedAtIso = new Date().toISOString();
    const completedAt = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    if (user) {
      await Promise.allSettled([
        ...beforeFiles.map((file) =>
          uploadPhoto.mutateAsync({ serviceId: service.id, uploadedBy: user.id, file, type: "before" })
        ),
        ...afterFiles.map((file) =>
          uploadPhoto.mutateAsync({ serviceId: service.id, uploadedBy: user.id, file, type: "after" })
        ),
      ]);
    }

    const { error } = await supabase
      .from("services")
      .update({ status: "completed", completed_at: completedAtIso })
      .eq("id", service.id);
    setCompleting(false);
    setConfirmOpen(false);
    if (error) {
      toast({ title: "Could not complete service", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["services"] });
    queryClient.invalidateQueries({ queryKey: ["service", service.id] });
    // Notify homeowner
    if (service.homeownerId) {
      await supabase.from("homeowner_notifications").insert({
        homeowner_id: service.homeownerId,
        service_id: service.id,
        kind: "service_completed",
        title: "Service Completed",
        body: `Your ${service.serviceType ?? "pool service"} has been completed. Check your service report for details.`,
        cta_route: `/service/${service.id}`,
      });
    }
    navigate("/tech/jobs", {
      state: {
        completedBanner: { homeownerName, completedAt },
      },
    });
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
            <h1 className="text-xl font-bold text-foreground">{homeownerName}</h1>
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

      {/* Cancellation notice */}
      {(homeowner?.subscriptionStatus === "pending_cancellation" || homeowner?.subscriptionStatus === "cancelled") && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900">
              {homeowner.subscriptionStatus === "pending_cancellation"
                ? "Subscription cancellation scheduled"
                : "Subscription cancelled"}
            </p>
            <p className="text-xs text-amber-800/80 mt-0.5">
              {homeowner.subscriptionStatus === "pending_cancellation"
                ? homeowner.subscriptionEffectiveEndDate
                  ? `${homeownerName}'s service will end on ${new Date(homeowner.subscriptionEffectiveEndDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. No new visits will be scheduled after that date.`
                  : `${homeownerName} has scheduled a cancellation. No new visits will be booked.`
                : `${homeownerName}'s subscription has ended. This may be one of their final service visits.`}
            </p>
          </div>
        </div>
      )}

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
          <p className="text-[15px] font-bold text-foreground">Chat with {homeownerName}</p>
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
          {dbMessages.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-6">No messages yet. Say hello!</p>
          ) : dbMessages.map((msg) => {
            const isTech = msg.senderId === user?.id;
            const time = new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
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
              placeholder={`Message ${homeownerName}...`}
              className="flex-1 rounded-xl border-border bg-muted/50 focus-visible:ring-primary"
            />
            <Button size="icon" onClick={handleSend} disabled={!newMsg.trim() || sendMessage.isPending} className="rounded-xl shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[220px] z-20 bg-card/95 backdrop-blur border-t border-border">
        <div className="max-w-[860px] mx-auto px-5 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs", canComplete ? "text-card-foreground" : "text-amber-600 dark:text-amber-400")}>
              {canComplete
                ? "All requirements met — ready to complete."
                : `Photos required: ${beforePhotos.length === 0 ? "before photos missing" : ""}${beforePhotos.length === 0 && afterPhotos.length === 0 ? " & " : ""}${afterPhotos.length === 0 ? "after photos missing" : ""}`}
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
