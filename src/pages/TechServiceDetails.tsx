import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar, Clock, CalendarClock, Play, CheckCircle2, MessagesSquare, Camera, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/StatusBadge";
import TechLayout from "@/components/technician/TechLayout";
import TechRescheduleModal from "@/components/technician/TechRescheduleModal";
import ServiceCompletionModal from "@/components/technician/ServiceCompletionModal";
import ReportRouteIssueModal, { type RouteService } from "@/components/ReportRouteIssueModal";
import { useService, useUpdateService } from "@/hooks/useServices";
import { usePool } from "@/hooks/usePools";
import { useProfile } from "@/hooks/useProfiles";
import { useUploadServicePhoto, useServicePhotos } from "@/hooks/useServicePhotos";
import { useAuth } from "@/contexts/AuthContext";
import { getPoolFullAddress, formatDateFull, TIME_LABELS, SERVICE_TASKS } from "@/types/tech";

const TechServiceDetails = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: service, isLoading: loadingService } = useService(serviceId);
  const { data: pool, isLoading: loadingPool } = usePool(service?.poolId);
  const { data: homeowner, isLoading: loadingHomeowner } = useProfile(service?.homeownerId);
  const updateService = useUpdateService();
  const uploadPhoto = useUploadServicePhoto();
  const { data: servicePhotos = [] } = useServicePhotos(isCompleted ? serviceId : undefined);

  const [showReschedule, setShowReschedule] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);

  const isLoading = loadingService || loadingPool || loadingHomeowner;

  if (isLoading) {
    return (
      <TechLayout>
        <Skeleton className="h-6 w-24 mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </TechLayout>
    );
  }

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

  const handleStartService = async () => {
    await updateService.mutateAsync({
      id: service.id,
      patch: { status: "in_progress", startedAt: new Date() },
    });
  };

  const handleCompletionSubmit = async (data: { beforePhotos: File[]; afterPhotos: File[]; completedTasks: string[]; notes: string }) => {
    if (user) {
      // Fire uploads in parallel; ignore individual failures so completion still records.
      await Promise.allSettled([
        ...data.beforePhotos.map((file) =>
          uploadPhoto.mutateAsync({ serviceId: service.id, uploadedBy: user.id, file, type: "before" })
        ),
        ...data.afterPhotos.map((file) =>
          uploadPhoto.mutateAsync({ serviceId: service.id, uploadedBy: user.id, file, type: "after" })
        ),
      ]);
    }
    await updateService.mutateAsync({
      id: service.id,
      patch: {
        status: "completed",
        completedAt: new Date(),
        completedTasks: data.completedTasks,
        techNotes: data.notes || undefined,
      },
    });
  };

  const handleReschedule = async (newDate: Date, newTime: string) => {
    await updateService.mutateAsync({
      id: service.id,
      patch: { serviceDate: newDate, timeWindow: newTime as "morning" | "afternoon" | "evening" },
    });
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
            <h1 className="text-xl font-bold text-foreground">{homeowner.fullName}</h1>
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

        {!isCompleted && (
          <div className="flex gap-3 mt-5 pt-5 border-t border-border">
            {!isInProgress ? (
              <Button className="flex-1 gap-1.5" onClick={handleStartService} disabled={updateService.isPending}>
                <Play className="h-4 w-4" />
                Start Service
              </Button>
            ) : (
              <Button className="flex-1 gap-1.5" onClick={() => setShowCompletion(true)}>
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

      {isCompleted && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-4">Service Report</h2>

          {(service.startedAt || service.completedAt) && (
            <div className="space-y-1.5 mb-4 pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Play className="h-4 w-4 text-card-foreground shrink-0" />
                <span>Start Time: {service.startedAt || service.completedAt}</span>
              </div>
              {service.completedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-card-foreground shrink-0" />
                  <span>Completion Time: {service.completedAt}</span>
                </div>
              )}
            </div>
          )}

          {(["before", "after"] as const).map((photoType) => {
            const photos = servicePhotos.filter((p) => p.type === photoType);
            return (
              <div key={photoType} className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground capitalize">{photoType} Photos</span>
                </div>
                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((p) => (
                      <div key={p.id} className="rounded-xl overflow-hidden border border-border">
                        <img src={p.url} alt={`Pool ${photoType} cleaning`} className="h-[110px] w-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No {photoType} photos uploaded.</p>
                )}
                {photoType === "before" && <div className="border-t border-border my-4" />}
              </div>
            );
          })}

          <div className="border-t border-border my-4" />

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

          <div className="border-t border-border my-4" />
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Other Notes</span>
            </div>
            <div className="bg-muted/50 rounded-xl px-4 py-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.techNotes || "No additional notes."}
              </p>
            </div>
          </div>
        </div>
      )}

      <TechRescheduleModal
        open={showReschedule}
        onOpenChange={setShowReschedule}
        currentDate={service.date}
        currentTimeWindow={service.timeWindow}
        homeownerName={homeowner.fullName}
        onConfirm={handleReschedule}
      />

      <ServiceCompletionModal
        open={showCompletion}
        onOpenChange={setShowCompletion}
        homeownerName={homeowner.fullName}
        onSubmit={handleCompletionSubmit}
      />

      <ReportRouteIssueModal
        open={showReportIssue}
        onOpenChange={setShowReportIssue}
        role="technician"
        services={[
          {
            id: service.id,
            homeowner: homeowner.fullName,
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
