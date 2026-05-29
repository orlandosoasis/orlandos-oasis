import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Send, Loader2 } from "lucide-react";
import { useSubmitRouteIssue } from "@/hooks/useRouteIssues";

export type RouteIssueType = "sick" | "breakdown" | "late" | "other";
export type RouteIssueAction = "notify" | "delay" | "reschedule" | "reassign";
export type ReportRole = "admin" | "technician";

export interface RouteService {
  id: string;
  homeowner: string;
  type?: string;
  time?: string;
}

interface ReportRouteIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: ReportRole;
  /** All services on today's route - used when "Entire route" is selected and as picker source */
  services: RouteService[];
  /** When set, scope is locked to this single service (e.g. job detail page entry) */
  lockedServiceId?: string;
  /** Optional list of technicians for reassign action (admin only) */
  technicians?: { id: string | number; name: string }[];
  /** Technician whose route is affected (required for admin "entire route" scope to filter) */
  technicianId?: string | null;
  /** Route date in YYYY-MM-DD (defaults to today) */
  routeDate?: string;
}

const ISSUE_OPTIONS: { value: RouteIssueType; label: string }[] = [
  { value: "sick", label: "Technician is sick" },
  { value: "breakdown", label: "Vehicle breakdown" },
  { value: "late", label: "Running late" },
  { value: "other", label: "Other" },
];

const DEFAULT_MESSAGES: Record<RouteIssueType, string> = {
  late: "Your pool service today may arrive later than expected due to route delays. Thank you for your patience.",
  sick: "Your assigned technician is unavailable today. We are arranging a replacement or new schedule.",
  breakdown: "We are experiencing a vehicle issue that may affect today's service schedule. We will keep you updated.",
  other: "",
};

const ISSUE_LABEL: Record<RouteIssueType, string> = {
  sick: "Technician sick",
  breakdown: "Vehicle breakdown",
  late: "Running late",
  other: "Other",
};

const ACTION_LABEL: Record<RouteIssueAction, string> = {
  notify: "Notify only",
  delay: "Delay services",
  reschedule: "Reschedule services",
  reassign: "Reassign technician",
};

const ReportRouteIssueModal = ({
  open,
  onOpenChange,
  role,
  services,
  lockedServiceId,
  technicians = [],
  technicianId,
  routeDate,
}: ReportRouteIssueModalProps) => {
  const { toast } = useToast();
  const submit = useSubmitRouteIssue();

  const [issueType, setIssueType] = useState<RouteIssueType | "">("");
  const [otherText, setOtherText] = useState("");
  const [scope, setScope] = useState<"all" | "specific">(lockedServiceId ? "specific" : "all");
  const [selectedIds, setSelectedIds] = useState<string[]>(lockedServiceId ? [lockedServiceId] : []);
  const [action, setAction] = useState<RouteIssueAction | "">("");
  const [delayDuration, setDelayDuration] = useState<"30" | "60" | "120" | "custom">("30");
  const [customDelay, setCustomDelay] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [reassignTechId, setReassignTechId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [messageEdited, setMessageEdited] = useState(false);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setIssueType("");
      setOtherText("");
      setScope(lockedServiceId ? "specific" : "all");
      setSelectedIds(lockedServiceId ? [lockedServiceId] : []);
      setAction("");
      setDelayDuration("30");
      setCustomDelay("");
      setNewDate("");
      setNewTime("");
      setReassignTechId("");
      setMessage("");
      setMessageEdited(false);
    }
  }, [open, lockedServiceId]);

  // Auto-fill message when issue type changes (unless user has edited it)
  useEffect(() => {
    if (!messageEdited && issueType && issueType !== "other") {
      setMessage(DEFAULT_MESSAGES[issueType]);
    }
  }, [issueType, messageEdited]);

  const affectedServices = useMemo(() => {
    if (lockedServiceId) return services.filter((s) => s.id === lockedServiceId);
    if (scope === "all") return services;
    return services.filter((s) => selectedIds.includes(s.id));
  }, [scope, selectedIds, services, lockedServiceId]);

  const affectedCount = affectedServices.length;

  const actionOptions: { value: RouteIssueAction; label: string; desc: string; disabled?: boolean }[] = [
    { value: "notify", label: "Notify only", desc: "No schedule changes" },
    { value: "delay", label: "Delay services", desc: "Shift all selected services by a duration" },
    { value: "reschedule", label: "Reschedule services", desc: "Move to a new date/time" },
    {
      value: "reassign",
      label: "Reassign technician",
      desc: role === "admin" ? "Assign a different technician" : "Admin only",
      disabled: role !== "admin",
    },
  ];

  const delayMinutes =
    action === "delay"
      ? delayDuration === "custom"
        ? Number(customDelay) || 0
        : Number(delayDuration)
      : 0;

  const reassignTechName = technicians.find((t) => String(t.id) === reassignTechId)?.name;

  const isValid = (() => {
    if (!issueType) return false;
    if (issueType === "other" && !otherText.trim()) return false;
    if (!action) return false;
    if (scope === "specific" && selectedIds.length === 0) return false;
    if (action === "delay" && delayDuration === "custom" && (!customDelay || Number(customDelay) <= 0)) return false;
    if (action === "reschedule" && (!newDate || !newTime)) return false;
    if (action === "reassign" && !reassignTechId) return false;
    if (!message.trim()) return false;
    return true;
  })();

  const isPendingApproval = role === "technician" && action === "reschedule";
  const submitLabel = isPendingApproval ? "Submit for Approval" : "Confirm & Send";

  const handleSubmit = async () => {
    if (!isValid || submit.isPending) return;
    try {
      await submit.mutateAsync({
        issueType: issueType as RouteIssueType,
        otherText: issueType === "other" ? otherText : undefined,
        technicianId: technicianId ?? undefined,
        routeDate,
        scope: lockedServiceId ? "specific" : scope,
        serviceIds: lockedServiceId ? [lockedServiceId] : scope === "specific" ? selectedIds : [],
        action: action as RouteIssueAction,
        delayMinutes: action === "delay" ? delayMinutes : undefined,
        newServiceDate: action === "reschedule" ? newDate : undefined,
        newTimeWindow: action === "reschedule" ? newTime : undefined,
        reassignTo: action === "reassign" ? reassignTechId : undefined,
        message,
      });

      let toastMsg = "";
      if (action === "notify") toastMsg = `Update sent to ${affectedCount} homeowner${affectedCount === 1 ? "" : "s"}`;
      else if (action === "delay") toastMsg = `Services delayed ${delayMinutes} min and homeowners notified`;
      else if (action === "reschedule")
        toastMsg = isPendingApproval
          ? "Request submitted for admin approval"
          : "Services rescheduled and homeowners notified";
      else if (action === "reassign")
        toastMsg = `Technician reassigned${reassignTechName ? ` to ${reassignTechName}` : ""} successfully`;

      toast({ title: toastMsg, variant: "success" as any });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Could not submit", description: err?.message ?? "Please try again.", variant: "destructive" });
    }
  };

  const formatDelay = () => {
    if (delayDuration === "custom") return `${customDelay || 0} min`;
    if (delayDuration === "120") return "2 hr";
    if (delayDuration === "60") return "1 hr";
    return "30 min";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report Route Issue
          </DialogTitle>
          <DialogDescription>
            Notify homeowners and update affected services for this route.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* 2. Issue Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">What's the issue?</Label>
            <div className="grid grid-cols-2 gap-2">
              {ISSUE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIssueType(opt.value)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-colors ${
                    issueType === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {issueType === "other" && (
              <Input
                placeholder="Enter short description"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* 3. Affected Services */}
          {!lockedServiceId && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Who is affected?</Label>
              <RadioGroup value={scope} onValueChange={(v) => setScope(v as "all" | "specific")}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="scope-all" />
                  <Label htmlFor="scope-all" className="font-normal cursor-pointer">
                    Entire route (Today) - {services.length} service{services.length === 1 ? "" : "s"}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="specific" id="scope-specific" />
                  <Label htmlFor="scope-specific" className="font-normal cursor-pointer">
                    Select specific services
                  </Label>
                </div>
              </RadioGroup>

              {scope === "specific" && (
                <div className="mt-2 border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
                  {services.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground text-center">No services on today's route.</div>
                  )}
                  {services.map((s) => {
                    const checked = selectedIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            setSelectedIds((prev) =>
                              v ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                            );
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{s.homeowner}</p>
                          {(s.type || s.time) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {[s.type, s.time].filter(Boolean).join(" • ")}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {lockedServiceId && affectedServices[0] && (
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
              <span className="font-semibold text-foreground">Affected service: </span>
              <span className="text-foreground">{affectedServices[0].homeowner}</span>
            </div>
          )}

          {/* 4. Action */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">What would you like to do?</Label>
            <div className="space-y-2">
              {actionOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => setAction(opt.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    action === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/50"
                  } ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <p className="text-sm font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Conditional fields */}
          {action === "delay" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Delay duration</Label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { v: "30", l: "30 min" },
                  { v: "60", l: "1 hr" },
                  { v: "120", l: "2 hrs" },
                  { v: "custom", l: "Custom" },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setDelayDuration(opt.v as any)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      delayDuration === opt.v
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/50"
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
              {delayDuration === "custom" && (
                <Input
                  type="number"
                  min={1}
                  placeholder="Minutes"
                  value={customDelay}
                  onChange={(e) => setCustomDelay(e.target.value)}
                />
              )}
            </div>
          )}

          {action === "reschedule" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">
                {role === "technician" ? "Suggested date & time" : "New date & arrival window"}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                <Select value={newTime} onValueChange={setNewTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8 AM – 12 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12 PM – 4 PM)</SelectItem>
                    <SelectItem value="evening">Evening (4 PM – 7 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role === "technician" && (
                <p className="text-xs text-muted-foreground">
                  This creates a pending request - admin approval required before changes apply.
                </p>
              )}
            </div>
          )}

          {action === "reassign" && role === "admin" && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Assign to technician</Label>
              <Select value={reassignTechId} onValueChange={setReassignTechId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 6. Message */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Message to homeowners</Label>
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setMessageEdited(true);
              }}
              placeholder="This message will be sent to affected homeowners…"
              rows={4}
            />
          </div>

          {/* 7. Summary */}
          {issueType && action && (
            <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Summary</p>
              <SummaryRow label="Issue" value={issueType === "other" ? otherText || "Other" : ISSUE_LABEL[issueType]} />
              <SummaryRow
                label="Affected"
                value={
                  lockedServiceId
                    ? `1 service (${affectedServices[0]?.homeowner ?? ""})`
                    : scope === "all"
                    ? `Entire route (${affectedCount})`
                    : `${affectedCount} service${affectedCount === 1 ? "" : "s"}`
                }
              />
              <SummaryRow label="Action" value={ACTION_LABEL[action]} />
              {action === "delay" && <SummaryRow label="Delay" value={formatDelay()} />}
              {action === "reschedule" && (newDate || newTime) && (
                <SummaryRow label="New schedule" value={`${newDate || "-"} ${newTime ? `• ${newTime}` : ""}`} />
              )}
              {action === "reassign" && reassignTechName && (
                <SummaryRow label="Technician" value={reassignTechName} />
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!isValid || submit.isPending} onClick={handleSubmit} className="gap-1.5">
            {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex text-xs">
    <span className="w-24 text-muted-foreground shrink-0">{label}:</span>
    <span className="text-foreground font-medium">{value}</span>
  </div>
);

export default ReportRouteIssueModal;
