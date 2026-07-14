import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "lucide-react";
import {
  LayoutDashboard, Wrench, Users, AlertCircle, UserPlus, ChevronLeft,
  Star, Mail, Check, X, LogOut, User, Menu, FileText, Download, Waves, MessageSquare, Megaphone,
  Plus, MoreHorizontal, Pencil, Trash2, CalendarClock, CalendarOff, CreditCard, BadgeCheck, Package
} from "lucide-react";
import AddonsManagementPage from "@/components/admin/AddonsManagementPage";
import ServiceCatalogPage from "@/components/admin/ServiceCatalogPage";
import HomeownerPricingPanel from "@/components/admin/HomeownerPricingPanel";
import HomeownerServicesPanel from "@/components/admin/HomeownerServicesPanel";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import oasisLogo from "@/assets/oo-logo.png";
import AddHomeownerModal from "@/components/admin/AddHomeownerModal";
import EditHomeownerModal from "@/components/admin/EditHomeownerModal";
import AdminNotesPanel from "@/components/admin/AdminNotesPanel";
import TechPoolAssignmentPanel from "@/components/admin/TechPoolAssignmentPanel";
import TechClientUpdatesPanel from "@/components/admin/TechClientUpdatesPanel";
import HomeownerBillingPanel from "@/components/admin/HomeownerBillingPanel";
import MembershipPanel from "@/components/admin/MembershipPanel";
import HomeownerRequestsPanel from "@/components/admin/HomeownerRequestsPanel";
import PastServiceDetailModal from "@/components/admin/PastServiceDetailModal";
import ReportRouteIssueModal, { type RouteService } from "@/components/ReportRouteIssueModal";
import { RouteIssuesListPage, RouteIssueDetailPage } from "@/components/admin/RouteIssuesPage";
import TimeOffPage from "@/components/admin/TimeOffPage";
import { useAdminRouteIssues } from "@/hooks/useRouteIssues";
import { useAllDayOffRequests } from "@/hooks/useDayOffRequests";
import type {
  AdminTechnician, AdminApplicant, AdminApplicantCert, AdminIssue,
  AdminTechReview, ReviewStatus, ReviewRejectionReason, AdminHomeowner,
} from "@/types/admin";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminTechnicians, useAdminHomeowners, useAdminIssues,
  useTechnicianApplications, useUpdateIssueStatus, useUpdateApplicationStatus, useApproveTechnician,
  useUpdateTechnicianActive, useUpdateTechnicianProfile, useUpdateTechnicianCompensation, useUpdateHomeownerProfile,
  useToggleFredsTag,
} from "@/hooks/useAdmin";
import { useReviews, useUpdateReviewStatus } from "@/hooks/useReviews";
import { useService, useUpdateService } from "@/hooks/useServices";
import { useAssignPoolToTech, useAssignTechToHomeowner } from "@/hooks/useAdminDetails";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie } from "recharts";
import { useExpenseItems, useCreateExpenseItem, useUpdateExpenseItem, useDeleteExpenseItem } from "@/hooks/useExpenseItems";

type AdminPage = "dashboard" | "technicians" | "techDetail" | "homeowners" | "homeDetail" | "issues" | "routeIssues" | "routeIssueDetail" | "timeOff" | "timeOffDetail" | "applicants" | "applicantDetail" | "reviews" | "addons" | "serviceCatalog";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  technicians: "Pool Technicians",
  techDetail: "Technician Details",
  homeowners: "Homeowners",
  homeDetail: "Homeowner Details",
  issues: "Reported Issues",
  routeIssues: "Route Issues",
  routeIssueDetail: "Route Issue Details",
  timeOff: "Time Off Requests",
  timeOffDetail: "Time Off Request",
  applicants: "Applicants",
  applicantDetail: "Application Details",
  reviews: "Review Moderation",
  addons: "Add-ons Catalog",
};

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    Active: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Inactive: "bg-muted text-muted-foreground border-border",
    Completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Scheduled: "bg-blue-50 text-blue-600 border-blue-200",
    "In Progress": "bg-blue-50 text-blue-600 border-blue-200",
    Open: "bg-amber-50 text-amber-600 border-amber-200",
    Resolved: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Pending: "bg-amber-50 text-amber-600 border-amber-200",
    Approved: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Rejected: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[status] || "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
};

const Stars = ({ rating }: { rating: number }) => (
  <span className="inline-flex items-center gap-1">
    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
    <span className="text-sm font-semibold">{rating}</span>
  </span>
);

const InfoRow = ({ label, value, badge }: { label: string; value: React.ReactNode; badge?: boolean }) => (
  <div className="flex py-2.5 border-b border-border">
    <span className="w-40 text-xs font-semibold text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm text-foreground font-medium">{badge ? <StatusBadge status={value as string} /> : value}</span>
  </div>
);

const AdminDashboard = () => {
  const [page, setPage] = useState<AdminPage>("dashboard");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [issueModal, setIssueModal] = useState<AdminIssue | null>(null);
  const [issueDraftStatus, setIssueDraftStatus] = useState<"open" | "in_progress" | "resolved">("open");
  const [issueDraftNotes, setIssueDraftNotes] = useState("");
  const [issueDraftTechId, setIssueDraftTechId] = useState<string>("");
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [svcDraftStatus, setSvcDraftStatus] = useState<"scheduled" | "in_progress" | "completed">("scheduled");
  const [svcDraftDate, setSvcDraftDate] = useState<Date | undefined>(undefined);
  const [svcDraftWindow, setSvcDraftWindow] = useState<"morning" | "afternoon" | "evening">("morning");
  const [svcDraftTechId, setSvcDraftTechId] = useState<string>("");
  const editServiceQuery = useService(editServiceId ?? undefined);
  const updateService = useUpdateService();

  useEffect(() => {
    const svc = editServiceQuery.data;
    if (svc) {
      setSvcDraftStatus(svc.status === "completed" ? "completed" : svc.status === "in_progress" ? "in_progress" : "scheduled");
      setSvcDraftDate(svc.date);
      setSvcDraftWindow(svc.timeWindow);
      setSvcDraftTechId(svc.technicianId ?? "");
    }
  }, [editServiceQuery.data]);

  const handleSaveService = async () => {
    if (!editServiceId) return;
    try {
      await updateService.mutateAsync({
        id: editServiceId,
        patch: {
          status: svcDraftStatus,
          serviceDate: svcDraftDate,
          timeWindow: svcDraftWindow,
        },
      });
      // Tech reassignment requires direct supabase call (hook patch doesn't include it)
      if (svcDraftTechId !== (editServiceQuery.data?.technicianId ?? "")) {
        await supabase.from("services").update({ technician_id: svcDraftTechId || null }).eq("id", editServiceId);
        await queryClient.invalidateQueries({ queryKey: ["services"] });
        await queryClient.invalidateQueries({ queryKey: ["admin-homeowners"] });
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-homeowners"] });
      toast({ title: "Service updated", variant: "success" });
      setEditServiceId(null);
    } catch (e) {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };
  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject"; applicant: AdminApplicant } | null>(null);
  const [approvedCredentials, setApprovedCredentials] = useState<{ email: string; password: string; name: string } | null>(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  

  // Live data from Supabase
  const techniciansQuery = useAdminTechnicians();
  const homeownersQuery = useAdminHomeowners();

  // Realtime: any profile change (membership status, cancellation, etc.) refreshes the list.
  useEffect(() => {
    const ch = supabase
      .channel("admin-profile-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-homeowners"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "subscription_events" }, (p) => {
        const hid = (p.new as { homeowner_id?: string } | null)?.homeowner_id;
        if (hid) queryClient.invalidateQueries({ queryKey: ["subscription-events", hid] });
        queryClient.invalidateQueries({ queryKey: ["admin-homeowners"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "issues" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-issues"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const issuesQuery = useAdminIssues();
  const applicationsQuery = useTechnicianApplications();
  const reviewsQuery = useReviews();
  const updateIssueStatus = useUpdateIssueStatus();
  const updateApplicationStatus = useUpdateApplicationStatus();
  const approveTechnician = useApproveTechnician();
  const updateReviewStatus = useUpdateReviewStatus();
  const assignPoolToTech = useAssignPoolToTech();
  const assignTechToHomeowner = useAssignTechToHomeowner();
  const updateTechnicianActive = useUpdateTechnicianActive();
  const updateTechnicianProfile = useUpdateTechnicianProfile();
  const updateTechnicianCompensation = useUpdateTechnicianCompensation();
  const toggleFredsTag = useToggleFredsTag();
  const [specialTab, setSpecialTab] = useState<"standard" | "grandfathered" | "freds">("standard");
  const [homeownerFilter, setHomeownerFilter] = useState<"all" | "standard" | "grandfathered" | "freds" | "placeholder" | "cancelled">("all");
  const [techFilter, setTechFilter] = useState<"all" | "active" | "inactive">("all");
  const [editTechId, setEditTechId] = useState<string | null>(null);
  const [techDraftName, setTechDraftName] = useState("");
  const [techDraftEmail, setTechDraftEmail] = useState("");
  const [techDraftPhone, setTechDraftPhone] = useState("");
  const [techDraftPayout, setTechDraftPayout] = useState("100");

  // Compensation editor (separate modal)
  const [editCompTechId, setEditCompTechId] = useState<string | null>(null);
  const [compDraftType, setCompDraftType] = useState<"hourly" | "per_service" | "daily">("per_service");
  const [compDraftRate, setCompDraftRate] = useState("");
  const [compDraftEffective, setCompDraftEffective] = useState("");
  const [compError, setCompError] = useState<string | null>(null);

  const isLoading =
    techniciansQuery.isLoading ||
    homeownersQuery.isLoading ||
    issuesQuery.isLoading ||
    applicationsQuery.isLoading ||
    reviewsQuery.isLoading;

  // Adapt aggregates → legacy view-model shapes used by the existing JSX.
  const technicians: AdminTechnician[] = (techniciansQuery.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    rating: t.rating,
    email: t.email,
    phone: t.phone ?? "-",
    status: t.status,
    assignedPools: t.assignedPools,
    completedServices: t.completedServices,
    payoutPerPool: t.payoutPerPool,
    payoutType: t.payoutType,
    payoutRate: t.payoutRate,
    payoutEffectiveDate: t.payoutEffectiveDate,
    payoutUpdatedAt: t.payoutUpdatedAt,
    reviews: t.reviews.map((r) => ({
      id: r.id,
      reviewer: r.reviewer,
      technicianName: t.name,
      rating: r.rating,
      message: r.message,
      date: r.date,
      status: r.status,
      rejectionReason: r.rejectionReason ?? "",
    })),
    pools: t.pools.map((p) => ({
      address: p.address,
      homeowner: p.homeowner,
      nextService: p.nextService,
      serviceType: p.serviceType,
    })),
  }));

  const fetchedHomeowners: (AdminHomeowner & { isGrandfathered?: boolean; grandfatheredNote?: string | null; isPlaceholder?: boolean; isFreds?: boolean; notificationsEnabled?: boolean })[] = (homeownersQuery.data ?? []).map((h) => ({
    id: h.id,
    name: h.name,
    email: h.email,
    phone: h.phone ?? "-",
    address: h.address,
    plan: h.plan,
    startDate: h.startDate,
    monthlyAmount: h.monthlyAmount,
    isGrandfathered: h.isGrandfathered,
    isPlaceholder: h.isPlaceholder,
    grandfatheredNote: h.grandfatheredNote,
    isFreds: h.isFreds,
    notificationsEnabled: h.notificationsEnabled,
    subscriptionStatus: h.subscriptionStatus,
    subscriptionCancelledAt: h.subscriptionCancelledAt,
    subscriptionEffectiveEndDate: h.subscriptionEffectiveEndDate,
    subscriptionCancellationReason: h.subscriptionCancellationReason,
    pools: h.pools.map((p) => ({
      id: p.id,
      address: p.address,
      size: p.size,
      technician: p.technicianName,
      technicianId: p.technicianId,
      nextService: p.nextService,
    })),
    services: h.services.map((s) => ({
      id: s.id,
      date: s.date,
      serviceDate: s.serviceDate,
      type: s.type,
      technician: s.technicianName,
      technicianId: s.technicianId,
      status: s.status,
      poolId: s.poolId,
    })),
    status: "Active",
  }));

  const issues: AdminIssue[] = (issuesQuery.data ?? []).map((i) => ({
    id: i.id,
    homeowner: i.homeownerName,
    type: i.type,
    message: i.message,
    serviceDate: i.serviceDate ?? "-",
    email: i.email,
    phone: i.phone ?? "-",
    status: i.status === "open" ? "Open" : i.status === "in_progress" ? "In Progress" : "Resolved",
    relatedService: i.relatedService ?? "-",
    adminNotes: i.adminNotes,
    assignedTechnicianId: i.assignedTechnicianId,
  }));

  const applicants: AdminApplicant[] = (applicationsQuery.data ?? []).map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
    phone: a.phone ?? "-",
    city: a.city ?? "-",
    state: a.state ?? "-",
    zip: a.zip ?? "-",
    experience: a.experience ?? "-",
    resume: a.resumeUrl ?? "",
    certifications: a.certifications.map((c) => ({
      name: c.name,
      file: c.fileUrl ?? "",
    })),
    appliedDate: a.appliedDate,
    status: (a.status.charAt(0).toUpperCase() + a.status.slice(1)) as AdminApplicant["status"],
    generatedEmail: a.generatedEmail ?? null,
    generatedPassword: a.generatedPassword ?? null,
    technicianProfileId: a.technicianProfileId ?? null,
  }));

  // Cross-tech reviews list (drives Reviews moderation page + badge).
  const allReviews: AdminTechReview[] = (reviewsQuery.data ?? []).map((r) => ({
    id: r.id,
    reviewer: r.reviewerName,
    technicianName: r.technicianName,
    rating: r.rating,
    message: r.message ?? "",
    date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    status: (r.status.charAt(0).toUpperCase() + r.status.slice(1)) as ReviewStatus,
    rejectionReason: r.rejectionReason ?? "",
  }));
  const pendingReviewCount = allReviews.filter((r) => r.status === "Pending").length;



  const [reviewFilter, setReviewFilter] = useState<"All" | ReviewStatus>("All");
  const [rejectReviewModal, setRejectReviewModal] = useState<AdminTechReview | null>(null);
  const [rejectionReason, setRejectionReason] = useState<ReviewRejectionReason>("");
  const [reviewDetailModal, setReviewDetailModal] = useState<AdminTechReview | null>(null);

  const [certModalData, setCertModalData] = useState<{ name: string; certs: AdminApplicantCert[] } | null>(null);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);
  

  const [rejectionEmailApplicant, setRejectionEmailApplicant] = useState<AdminApplicant | null>(null);
  const [rejectionEmailSubject, setRejectionEmailSubject] = useState("");
  const [rejectionEmailBody, setRejectionEmailBody] = useState("");

  // Locally-added homeowners (modal-managed; no schema for plan/notes/payments yet).
  const [extraHomeowners, setExtraHomeowners] = useState<AdminHomeowner[]>([]);
  const homeowners: AdminHomeowner[] = [...extraHomeowners, ...fetchedHomeowners];
  const [addHomeownerOpen, setAddHomeownerOpen] = useState(false);
  const [editHomeownerOpen, setEditHomeownerOpen] = useState(false);
  const [editingHomeowner, setEditingHomeowner] = useState<AdminHomeowner | null>(null);
  const [homeownerSuccess, setHomeownerSuccess] = useState(false);
  const [homeownerEditSuccess, setHomeownerEditSuccess] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"upcoming" | "past">("upcoming");
  const [detailTab, setDetailTab] = useState<"overview" | "pools" | "schedule" | "requests" | "billing" | "membership" | "services" | "notes">("overview");
  const [pastServiceId, setPastServiceId] = useState<string | null>(null);

  const nav = (p: AdminPage, id: string | null = null) => { setPage(p); setDetailId(id); setSidebarOpen(false); };

  const handleApprove = async (applicant: AdminApplicant) => {
    try {
      const result = await approveTechnician.mutateAsync(applicant.id);
      setConfirmAction(null);
      setApprovedCredentials({ email: result.email, password: result.password, name: `${applicant.firstName} ${applicant.lastName}` });
      toast({ title: "Applicant Approved", description: `${applicant.firstName} ${applicant.lastName} approved and account created.`, variant: "success" });
    } catch (e) {
      toast({ title: "Approve failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  const DEFAULT_REJECTION_MESSAGE = "Thank you for applying for the position. We appreciate the time and effort you put into your application. After careful review, we have decided to move forward with another candidate at this time. We wish you the best in your job search and future opportunities.";

  const handleReject = async (applicant: AdminApplicant) => {
    try {
      await updateApplicationStatus.mutateAsync({ id: applicant.id, status: "rejected" });
      setConfirmAction(null);
      if (page === "applicantDetail") nav("applicants");
      // Automatically send rejection email
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-rejection-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            toEmail: applicant.email,
            toName: `${applicant.firstName} ${applicant.lastName}`,
            subject: "Thank you for applying to Orlando's Oasis",
            body: DEFAULT_REJECTION_MESSAGE,
          }),
        });
      }
      toast({ title: "Application Rejected", description: `${applicant.firstName} ${applicant.lastName} rejected and notified by email.`, variant: "success" });
    } catch (e) {
      toast({ title: "Reject failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  const handleSendRejectionEmail = async () => {
    if (!rejectionEmailApplicant) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-rejection-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          toEmail: rejectionEmailApplicant.email,
          toName: `${rejectionEmailApplicant.firstName} ${rejectionEmailApplicant.lastName}`,
          subject: rejectionEmailSubject,
          body: rejectionEmailBody,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to send email");
      toast({ title: "Email Sent", description: `Rejection email sent to ${rejectionEmailApplicant.email}.`, variant: "success" });
    } catch (e) {
      toast({ title: "Email failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
    setRejectionEmailApplicant(null);
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const handleApproveReview = async (reviewId: string) => {
    try {
      await updateReviewStatus.mutateAsync({ id: reviewId, status: "approved" });
      toast({ title: "Review Approved", description: "The review is now publicly visible.", variant: "success" });
    } catch (e) {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  const handleRejectReview = async (reviewId: string, reason: ReviewRejectionReason) => {
    try {
      await updateReviewStatus.mutateAsync({ id: reviewId, status: "rejected", rejectionReason: reason || null });
      setRejectReviewModal(null);
      setRejectionReason("");
      toast({ title: "Review Rejected", description: "The review has been rejected and hidden from public view.", variant: "destructive" });
    } catch (e) {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  const openIssueModal = (issue: AdminIssue) => {
    setIssueModal(issue);
    setIssueDraftStatus(issue.status === "Open" ? "open" : issue.status === "In Progress" ? "in_progress" : "resolved");
    setIssueDraftNotes(issue.adminNotes ?? "");
    setIssueDraftTechId(issue.assignedTechnicianId ?? "");
  };

  const handleSaveIssue = async () => {
    if (!issueModal) return;
    try {
      await updateIssueStatus.mutateAsync({
        id: issueModal.id,
        status: issueDraftStatus,
        adminNotes: issueDraftNotes || null,
        assignedTechnicianId: issueDraftTechId || null,
      });
      toast({ title: "Issue updated", variant: "success" });
      setIssueModal(null);
    } catch (e) {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  const handleResolveIssue = async (id: string) => {
    try {
      await updateIssueStatus.mutateAsync({ id, status: "resolved" });
      toast({ title: "Issue resolved", variant: "success" });
      setIssueModal(null);
    } catch (e) {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  const pendingCount = applicants.filter(a => a.status === "Pending").length;
  const openIssueCount = issues.filter(i => i.status === "Open").length;
  const { data: routeIssueData } = useAdminRouteIssues();
  const pendingRouteIssueCount = (routeIssueData ?? []).filter(r => r.status === "pending_approval").length;
  const activeRouteIssueCount = (routeIssueData ?? []).filter(r => r.status === "active" || r.status === "pending_approval").length;
  const { data: dayOffData } = useAllDayOffRequests();
  const pendingDayOffCount = (dayOffData ?? []).filter(r => r.status === "pending").length;


  const menuItems = [
    { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { key: "technicians" as const, label: "Technicians", icon: Wrench },
    { key: "homeowners" as const, label: "Homeowners", icon: Users },
    { key: "reviews" as const, label: "Reviews", icon: MessageSquare, badge: pendingReviewCount, badgeColor: "bg-amber-500" },
    { key: "applicants" as const, label: "Applicants", icon: UserPlus, badge: pendingCount, badgeColor: "bg-violet-500" },
    { key: "issues" as const, label: "Reported Issues", icon: AlertCircle, badge: openIssueCount, badgeColor: "bg-destructive" },
    { key: "routeIssues" as const, label: "Route Issues", icon: CalendarClock, badge: activeRouteIssueCount, badgeColor: pendingRouteIssueCount > 0 ? "bg-amber-500" : "bg-blue-500" },
    { key: "timeOff" as const, label: "Time Off", icon: CalendarOff, badge: pendingDayOffCount, badgeColor: "bg-amber-500" },
    { key: "addons" as const, label: "Add-ons", icon: Package },
    { key: "serviceCatalog" as const, label: "Services Catalog", icon: Wrench },
  ];

  const handleMessagesNav = () => navigate("/admin/messages");

  const activeMenu = page === "techDetail" ? "technicians"
    : page === "homeDetail" ? "homeowners"
    : page === "applicantDetail" ? "applicants"
    : page === "routeIssueDetail" ? "routeIssues"
    : page === "timeOffDetail" ? "timeOff"
    : page;

  // ═══════════ SIDEBAR ═══════════
  const Sidebar = () => (
    <>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-[998] md:hidden" />}
      <aside className={`w-[250px] bg-[hsl(var(--oasis-navy))] h-screen fixed top-0 z-[999] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-5 pb-4 flex items-center gap-3 border-b border-white/10">
          <img src={oasisLogo} alt="Orlando's Oasis" className="h-9 w-9 object-contain" />
          <div>
            <div className="text-white font-bold text-sm tracking-tight">Orlando's Oasis</div>
            <div className="text-white/50 text-[11px] font-medium mt-0.5">Admin Portal</div>
          </div>
        </div>
        <nav className="p-3 flex-1 space-y-1">
          {menuItems.map(item => {
            const active = activeMenu === item.key;
            const Icon = item.icon;
            return (
              <button key={item.key} onClick={() => nav(item.key)}
                className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left ${active ? "bg-white/15 text-white font-semibold" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
                {item.badge ? <span className={`ml-auto text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>{item.badge}</span> : null}
              </button>
            );
          })}
          <button
            onClick={handleMessagesNav}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left text-white/60 hover:bg-white/10 hover:text-white mt-1"
          >
            <MessageSquare className="h-[18px] w-[18px]" />
            Messages
          </button>
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2.5 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs text-white font-bold">AD</div>
            <div>
              <div className="text-white text-xs font-semibold">{user?.fullName || "Admin User"}</div>
              <div className="text-white/50 text-[10px]">{user?.email || "admin@oasis.com"}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-2.5 py-2 mt-1 rounded-lg text-red-400 text-xs font-medium hover:bg-white/10 transition-colors">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>
    </>
  );

  // ═══════════ TOP NAV ═══════════
  const TopNav = () => (
    <header className="h-[60px] bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-[100]">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-foreground"><Menu className="h-5 w-5" /></button>
        <h2 className="text-base font-bold text-foreground tracking-tight">{PAGE_TITLES[page] || "Dashboard"}</h2>
      </div>
    </header>
  );

  // ═══════════ APPOINTMENTS (UPCOMING / PAST) ═══════════
  const [apptTab, setApptTab] = useState<"upcoming" | "past">("upcoming");
  const [apptPage, setApptPage] = useState(1);
  useEffect(() => { setApptPage(1); }, [apptTab]);
  const PAGE_SIZE = 10;

  const AppointmentsCard = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const SEEN_KEY = "oo_admin_seen_services";
    const getSeenIds = (): Set<string> => {
      try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]")); } catch { return new Set(); }
    };
    const markSeen = (id: string) => {
      const s = getSeenIds(); s.add(id);
      localStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
    };
    const [seenIds, setSeenIds] = useState<Set<string>>(getSeenIds);
    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const handleRowClick = (id: string) => {
      markSeen(id);
      setSeenIds(getSeenIds());
      setPastServiceId(id);
    };
    type Row = {
      id: string; date: Date; dateLabel: string; homeowner: string; address: string;
      poolSize: string; type: string; status: string; technicianId: string | null; technicianName: string;
      isGrandfathered: boolean; grandfatheredNote: string | null; createdAt: string; updatedAt: string;
    };
    const upcoming: Row[] = [];
    const past: Row[] = [];
    for (const h of fetchedHomeowners) {
      for (const s of h.services) {
        if (!s.id) continue;
        const d = s.serviceDate ? new Date(s.serviceDate) : new Date(s.date);
        if (isNaN(d.getTime())) continue;
        const pool = h.pools.find((p) => p.id === s.poolId);
        const row: Row = {
          id: s.id,
          date: d,
          dateLabel: format(d, "EEE, MMM d"),
          homeowner: h.name,
          address: pool?.address ?? h.address ?? "—",
          poolSize: pool?.size ?? "—",
          type: s.type,
          status: s.status,
          technicianId: s.technicianId ?? pool?.technicianId ?? null,
          technicianName: s.technician || pool?.technician || "Unassigned",
          isGrandfathered: Boolean((h as { isGrandfathered?: boolean }).isGrandfathered),
          grandfatheredNote: (h as { grandfatheredNote?: string | null }).grandfatheredNote ?? null,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
        if (s.status === "Scheduled" && d >= today) upcoming.push(row);
        else if (s.status === "Completed" || d < today) past.push(row);
      }
    }
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    past.sort((a, b) => b.date.getTime() - a.date.getTime());

    const rows = apptTab === "upcoming" ? upcoming : past;
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const page = Math.min(apptPage, totalPages);
    const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const isNew = (r: Row) =>
      r.status === "Scheduled" &&
      new Date(r.createdAt) >= sevenDaysAgo &&
      !seenIds.has(r.id);
    const isRescheduled = (r: Row) =>
      r.status === "Scheduled" &&
      r.updatedAt &&
      new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime() > 60_000;
    const unseenCount = upcoming.filter(isNew).length;

    const handleAssign = async (serviceId: string, techId: string) => {
      try {
        const newTech = techId === "unassigned" ? null : techId;
        const { error } = await supabase.from("services").update({ technician_id: newTech }).eq("id", serviceId);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ["services"] });
        await queryClient.invalidateQueries({ queryKey: ["admin-homeowners"] });
        // Insert homeowner notification
        const ownerEntry = fetchedHomeowners.find((h) => h.services.some((s) => s.id === serviceId));
        if (ownerEntry) {
          const techName = newTech ? (technicians.find((t) => t.id === newTech)?.name ?? "Your technician") : null;
          await supabase.from("homeowner_notifications").insert({
            homeowner_id: ownerEntry.id,
            service_id: serviceId,
            kind: newTech ? "technician_assigned" : "technician_unassigned",
            title: newTech ? "Technician Assigned" : "Technician Unassigned",
            body: newTech
              ? `${techName} has been assigned to your upcoming service.`
              : "The technician for your upcoming service has been unassigned. We'll assign a new one soon.",
            cta_route: `/service/${serviceId}`,
          });
        }
        toast({ title: newTech ? "Technician assigned" : "Technician unassigned", variant: "success" });
      } catch (e) {
        toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      }
    };

    const activeTechs = technicians.filter((t) => t.status === "Active");

    return (
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              Appointments
              {unseenCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                  {unseenCount}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
              <button
                onClick={() => setApptTab("upcoming")}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${apptTab === "upcoming" ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Upcoming ({upcoming.length})
              </button>
              <button
                onClick={() => setApptTab("past")}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${apptTab === "past" ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                Past ({past.length})
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Homeowner</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Pool</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="w-[220px]">Technician</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground text-xs py-8">
                    No {apptTab} appointments.
                  </TableCell>
                </TableRow>
              ) : visible.map((r) => (
                <TableRow
                  key={r.id}
                  className={`cursor-pointer hover:bg-muted/50 transition-colors${isNew(r) ? " bg-sky-50/60" : ""}`}
                  onClick={() => handleRowClick(r.id)}
                >
                  <TableCell className="font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {r.dateLabel}
                      {isNew(r) && (
                        <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-100 text-sky-700 border border-sky-200">
                          New
                        </span>
                      )}
                      {isRescheduled(r) && (
                        <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-200">
                          Rescheduled
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span>{r.homeowner}</span>
                      {r.isGrandfathered && (
                        <span title={r.grandfatheredNote ?? "Legacy rate"} className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                          GF
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.address}</TableCell>
                  <TableCell className="text-xs">{r.poolSize}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {apptTab === "upcoming" ? (
                      <Select
                        value={r.technicianId ?? "unassigned"}
                        onValueChange={(v) => handleAssign(r.id, v)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Assign technician" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            <span className="text-muted-foreground">Unassigned</span>
                          </SelectItem>
                          {activeTechs.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs">{r.technicianName}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {rows.length} total
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setApptPage(page - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setApptPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ═══════════ FINANCIALS CARD (Revenue / Payouts / Supplies / Profit) ═══════════
  type RevenueRow = { label: string; count: number; revenue: number; price: number };
  type FinTech = { id: string; name: string; assignedPools: number; payoutPerPool?: number };
  type FinHome = {
    pools: { size: string }[];
    monthlyAmount?: number;
    isGrandfathered?: boolean;
    isFreds?: boolean;
  };

  const FinancialsCard = ({
    revenueRows, totalMRR, totalPools, technicians, homeowners,
  }: {
    revenueRows: RevenueRow[];
    totalMRR: number;
    totalPools: number;
    technicians: FinTech[];
    homeowners: FinHome[];
  }) => {
    const [tab, setTab] = useState<"revenue" | "payouts" | "supplies" | "profit">("revenue");
    const now = new Date();
    const currentYear = now.getFullYear();
    const [revenueYear, setRevenueYear] = useState<number>(currentYear);
    const [revenueGroup, setRevenueGroup] = useState<"all" | "standard" | "freds">("all");
    const [payoutYear, setPayoutYear] = useState<number>(currentYear);

    // ── Editable supplies (from DB) ──
    const expenseItemsQuery = useExpenseItems();
    const createExpense = useCreateExpenseItem();
    const updateExpense = useUpdateExpenseItem();
    const deleteExpense = useDeleteExpenseItem();
    const expenseItems = expenseItemsQuery.data ?? [];
    const chemicals = expenseItems.filter((e) => e.category === "chemical");
    const equipment = expenseItems.filter((e) => e.category === "equipment");

    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editCost, setEditCost] = useState("");
    const [newChemName, setNewChemName] = useState("");
    const [newChemCost, setNewChemCost] = useState("");
    const [newEquipName, setNewEquipName] = useState("");
    const [newEquipCost, setNewEquipCost] = useState("");

    // Tech payouts = assignedPools × payoutPerPool
    const payoutRows = technicians
      .map((t) => ({
        id: t.id,
        name: t.name,
        pools: t.assignedPools,
        rate: t.payoutPerPool ?? 100,
        total: (t.assignedPools) * (t.payoutPerPool ?? 100),
      }))
      .sort((a, b) => b.total - a.total);
    const totalPayouts = payoutRows.reduce((a, r) => a + r.total, 0);

    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const FIRST_DATA_YEAR = 2025; // earliest year selectable
    const availableYears: number[] = [];
    for (let y = currentYear; y >= FIRST_DATA_YEAR; y--) availableYears.push(y);

    // Returns the fraction of a given (year, monthIndex) that has elapsed relative to `now`.
    // 0 = future (no data yet), 1 = month fully complete, partial = current month.
    const monthFraction = (year: number, monthIdx: number): number => {
      if (year < currentYear) return 1;
      if (year > currentYear) return 0;
      if (monthIdx < now.getMonth()) return 1;
      if (monthIdx > now.getMonth()) return 0;
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
      return now.getDate() / daysInMonth;
    };

    // Stacked revenue breakdown per month for the selected year.
    // Series are always pool-size buckets (Small / Medium / Large) plus Grandfathered.
    // The customer-group dropdown narrows the population — it is NOT a series of its own,
    // so a Fred's customer with a Small Pool counts under "Small Pool".
    const REVENUE_KEYS = ["small", "medium", "large", "grandfathered"] as const;
    type RevenueKey = typeof REVENUE_KEYS[number];
    const REVENUE_LABELS: Record<RevenueKey, string> = {
      small: "Small Pool",
      medium: "Medium Pool",
      large: "Large Pool",
      grandfathered: "Grandfathered",
    };
    const REVENUE_COLORS: Record<RevenueKey, string> = {
      small: "hsl(var(--primary))",
      medium: "hsl(199 89% 48%)",
      large: "hsl(173 80% 40%)",
      grandfathered: "hsl(38 92% 50%)",
    };

    // Population filter — single source of truth for chart, totals, pool counts, and legend.
    const inGroup = (h: typeof homeowners[number]) => {
      if (revenueGroup === "freds") return Boolean(h.isFreds);
      if (revenueGroup === "standard") return !h.isFreds;
      return true;
    };
    const populationHomeowners = homeowners.filter(inGroup);

    // Compute steady recurring monthly revenue per category from the filtered population.
    const categoryCount: Record<RevenueKey, number> = { small: 0, medium: 0, large: 0, grandfathered: 0 };
    const categoryMRR: Record<RevenueKey, number> = { small: 0, medium: 0, large: 0, grandfathered: 0 };
    for (const h of populationHomeowners) {
      if (h.pools.length === 0) continue;
      // Grandfathered legacy pricing lives in its own bucket regardless of pool size.
      if (h.isGrandfathered) {
        categoryCount.grandfathered += h.pools.length;
        if (h.monthlyAmount) categoryMRR.grandfathered += h.monthlyAmount;
        continue;
      }
      const perPool = h.monthlyAmount ? h.monthlyAmount / h.pools.length : 0;
      for (const p of h.pools) {
        const s = (p.size ?? "").toLowerCase();
        const bucket: RevenueKey = s.includes("small") ? "small" : s.includes("large") ? "large" : "medium";
        categoryCount[bucket] += 1;
        categoryMRR[bucket] += perPool;
      }
    }

    // Only render series that have any data so the legend stays clean.
    const groupKeys: readonly RevenueKey[] = REVENUE_KEYS.filter((k) => categoryCount[k] > 0);
    const filteredMRR = REVENUE_KEYS.reduce((a, k) => a + categoryMRR[k], 0);
    const filteredPools = REVENUE_KEYS.reduce((a, k) => a + categoryCount[k], 0);

    const revenueMonthly = MONTHS.map((m, i) => {
      const frac = monthFraction(revenueYear, i);
      const row: Record<string, number | string> = { month: m };
      let total = 0;
      for (const k of groupKeys) {
        const v = Math.round(categoryMRR[k] * frac);
        row[k] = v;
        total += v;
      }
      row.total = total;
      return row;
    });
    const payoutMonthly = MONTHS.map((m, i) => ({
      month: m,
      total: Math.round(totalPayouts * monthFraction(payoutYear, i)),
    }));
    const revenueYearTotal = revenueMonthly.reduce((a, r) => a + (r.total as number), 0);
    const payoutYearTotal = payoutMonthly.reduce((a, r) => a + r.total, 0);

    // Supplies
    const allPoolsCount = homeowners.reduce((a, h) => a + h.pools.length, 0);
    const chemTotalPerPool = chemicals.reduce((a, c) => a + c.perPoolCost, 0);
    const equipTotalPerPool = equipment.reduce((a, c) => a + c.perPoolCost, 0);
    const chemMonthly = chemTotalPerPool * allPoolsCount;
    const equipMonthly = equipTotalPerPool * allPoolsCount;
    const suppliesTotal = chemMonthly + equipMonthly;

    const netProfit = totalMRR - totalPayouts - suppliesTotal;
    const yearlyProfit = netProfit * 12;
    const margin = totalMRR > 0 ? (netProfit / totalMRR) * 100 : 0;

    const profitPie = [
      { name: "Net Profit", value: Math.max(netProfit, 0), color: "hsl(160 84% 39%)" },
      { name: "Tech Payouts", value: totalPayouts, color: "hsl(38 92% 50%)" },
      { name: "Supplies", value: suppliesTotal, color: "hsl(0 84% 60%)" },
    ];

    const startEditExpense = (item: typeof expenseItems[number]) => {
      setEditingExpenseId(item.id);
      setEditName(item.name);
      setEditCost(String(item.perPoolCost));
    };
    const saveEditExpense = async () => {
      if (!editingExpenseId) return;
      const cost = Number(editCost);
      if (!editName.trim() || !Number.isFinite(cost) || cost < 0) {
        toast({ title: "Invalid item", description: "Name and a non-negative cost are required.", variant: "destructive" });
        return;
      }
      try {
        await updateExpense.mutateAsync({ id: editingExpenseId, name: editName.trim(), perPoolCost: cost });
        toast({ title: "Item updated", variant: "success" });
        setEditingExpenseId(null);
      } catch (e) {
        toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      }
    };
    const addExpenseRow = async (category: "chemical" | "equipment", name: string, cost: string, reset: () => void) => {
      const num = Number(cost);
      if (!name.trim() || !Number.isFinite(num) || num < 0) {
        toast({ title: "Add a name and cost", description: "Both fields are required.", variant: "destructive" });
        return;
      }
      try {
        await createExpense.mutateAsync({ name: name.trim(), category, perPoolCost: num });
        toast({ title: "Item added", variant: "success" });
        reset();
      } catch (e) {
        toast({ title: "Create failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      }
    };
    const removeExpense = async (id: string) => {
      try {
        await deleteExpense.mutateAsync(id);
        toast({ title: "Item removed", variant: "success" });
      } catch (e) {
        toast({ title: "Delete failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
      }
    };

    const TAB_BTN = (key: typeof tab, label: string) => (
      <button
        key={key}
        onClick={() => setTab(key)}
        className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${tab === key ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
      >
        {label}
      </button>
    );

    const renderSupplySection = (
      title: string,
      rows: typeof chemicals,
      perPool: number,
      monthly: number,
      category: "chemical" | "equipment",
      newName: string,
      setNewName: (v: string) => void,
      newCost: string,
      setNewCost: (v: string) => void,
    ) => (
      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div className="text-xs font-bold text-foreground">{title} · {allPoolsCount} pools</div>
          <div className="text-xs text-muted-foreground">
            Per pool <span className="text-foreground font-semibold">{fmtMoney(perPool)}</span> · Monthly <span className="text-foreground font-semibold">{fmtMoney(monthly)}</span>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right w-[140px]">Cost / Pool</TableHead>
              <TableHead className="text-right w-[140px]">Monthly Total</TableHead>
              <TableHead className="text-right w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-xs py-6">No items yet.</TableCell></TableRow>
            ) : rows.map((c) => {
              const isEditing = editingExpenseId === c.id;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    {isEditing ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" />
                    ) : c.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input type="number" min="0" step="0.01" value={editCost} onChange={(e) => setEditCost(e.target.value)} className="h-8 text-right" />
                    ) : fmtMoney(c.perPoolCost)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{fmtMoney(c.perPoolCost * allPoolsCount)}</TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => setEditingExpenseId(null)}>Cancel</Button>
                        <Button size="sm" onClick={saveEditExpense} disabled={updateExpense.isPending}>Save</Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => startEditExpense(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => removeExpense(c.id)} disabled={deleteExpense.isPending}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/30">
              <TableCell>
                <Input
                  placeholder={`Add ${category === "chemical" ? "chemical" : "item"}…`}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8"
                />
              </TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  className="h-8 text-right"
                />
              </TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => addExpenseRow(category, newName, newCost, () => { setNewName(""); setNewCost(""); })}
                  disabled={createExpense.isPending}
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );

    return (
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle className="text-sm font-bold">
              Financials
            </CardTitle>
            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
              {TAB_BTN("revenue", "Revenue")}
              {TAB_BTN("payouts", "Technician Payouts")}
              {TAB_BTN("supplies", "Chemicals & Supplies")}
              {TAB_BTN("profit", "Profit")}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {tab === "revenue" && <>Total <span className="ml-1 text-foreground font-bold">{fmtMoney(filteredMRR)}</span> · {filteredPools} pools</>}
            {tab === "payouts" && <>Total <span className="ml-1 text-foreground font-bold">{fmtMoney(totalPayouts)}</span>/mo</>}
            {tab === "supplies" && <>Total <span className="ml-1 text-foreground font-bold">{fmtMoney(suppliesTotal)}</span> · {allPoolsCount} pools</>}
            {tab === "profit" && <>Net <span className={`ml-1 font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmtMoney(netProfit)}</span>/mo</>}
          </div>
        </CardHeader>
        <CardContent>
          {tab === "revenue" && (
            totalPools === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-10">No pools on file yet.</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs font-bold text-foreground">Revenue by Month · {revenueYear}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      Year total <span className="text-foreground font-semibold">{fmtMoney(revenueYearTotal)}</span>
                    </div>
                    <Select value={revenueGroup} onValueChange={(v) => setRevenueGroup(v as typeof revenueGroup)}>
                      <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Customers</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="freds">Fred's</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={String(revenueYear)} onValueChange={(v) => setRevenueYear(Number(v))}>
                      <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableYears.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {filteredMRR === 0 ? (
                  <div className="text-center text-muted-foreground text-xs py-16 border border-dashed rounded-lg">
                    No revenue for{" "}
                    {revenueGroup === "freds" ? "Fred's customers" : revenueGroup === "standard" ? "standard customers" : "the selected group"}
                    {" "}in {revenueYear}.
                  </div>
                ) : (
                  <>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueMonthly} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                          <ReTooltip
                            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                            formatter={(value: number, name) => [fmtMoney(value), REVENUE_LABELS[name as typeof REVENUE_KEYS[number]] ?? String(name)]}
                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                          />
                          {groupKeys.map((k, idx) => (
                            <Bar
                              key={k}
                              dataKey={k}
                              stackId="rev"
                              fill={REVENUE_COLORS[k]}
                              radius={idx === groupKeys.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                      {groupKeys.map((k) => (
                        <div key={k} className="flex items-center gap-1.5">
                          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: REVENUE_COLORS[k] }} />
                          <span className="text-foreground">{REVENUE_LABELS[k]} ({categoryCount[k]})</span>
                          <span>· {fmtMoney(categoryMRR[k])}/mo</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          )}

          {tab === "payouts" && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="text-xs font-bold text-foreground">Payouts by Month · {payoutYear}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      Year total <span className="text-foreground font-semibold">{fmtMoney(payoutYearTotal)}</span>
                    </div>
                    <Select value={String(payoutYear)} onValueChange={(v) => setPayoutYear(Number(v))}>
                      <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableYears.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={payoutMonthly} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
                      <ReTooltip
                        cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                        formatter={(value: number) => [fmtMoney(value), "Tech payouts"]}
                        contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      />
                      <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="hsl(38 92% 50%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Technician</TableHead>
                    <TableHead className="text-right">Assigned Pools</TableHead>
                    <TableHead className="text-right">Rate / Pool</TableHead>
                    <TableHead className="text-right">Monthly Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutRows.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground text-xs py-6">No technicians.</TableCell></TableRow>
                  ) : payoutRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-right">{r.pools}</TableCell>
                      <TableCell className="text-right">{fmtMoney(r.rate)}</TableCell>
                      <TableCell className="text-right font-semibold">{fmtMoney(r.total)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{payoutRows.reduce((a, r) => a + r.pools, 0)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right font-extrabold text-foreground">{fmtMoney(totalPayouts)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          {tab === "supplies" && (
            expenseItemsQuery.isLoading ? (
              <div className="text-center text-muted-foreground text-xs py-10">Loading…</div>
            ) : (
              <div className="space-y-6">
                {renderSupplySection("Chemicals", chemicals, chemTotalPerPool, chemMonthly, "chemical", newChemName, setNewChemName, newChemCost, setNewChemCost)}
                {renderSupplySection("Equipment & Consumables", equipment, equipTotalPerPool, equipMonthly, "equipment", newEquipName, setNewEquipName, newEquipCost, setNewEquipCost)}
                <div className="rounded-lg border bg-muted/30 p-4 flex items-center justify-between">
                  <div className="text-xs font-bold text-foreground">Supplies Total · Monthly</div>
                  <div className="text-xl font-extrabold text-foreground">{fmtMoney(suppliesTotal)}</div>
                </div>
              </div>
            )
          )}

          {tab === "profit" && (
            <div className="space-y-6">
              {/* Hero net profit */}
              <div className={`rounded-xl p-6 ${netProfit >= 0 ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200" : "bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200"}`}>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Net Profit · This Month</div>
                    <div className={`text-5xl font-extrabold mt-2 ${netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmtMoney(netProfit)}</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {fmtMoney(totalMRR)} revenue − {fmtMoney(totalPayouts)} payouts − {fmtMoney(suppliesTotal)} supplies
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="text-xs">
                        <span className="font-bold text-foreground">{margin.toFixed(1)}%</span>
                        <span className="text-muted-foreground"> margin</span>
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-foreground">{fmtMoney(yearlyProfit)}</span>
                        <span className="text-muted-foreground"> annualized</span>
                      </div>
                    </div>
                  </div>
                  {totalMRR > 0 && (
                    <div className="h-[200px] w-full md:w-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={profitPie}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={2}
                            stroke="hsl(var(--background))"
                            strokeWidth={2}
                          >
                            {profitPie.map((s, i) => <Cell key={i} fill={s.color} />)}
                          </Pie>
                          <ReTooltip
                            formatter={(value: number, name: string) => [fmtMoney(value), name]}
                            contentStyle={{ borderRadius: 8, fontSize: 12 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* KPI breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border bg-emerald-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Revenue</div>
                  </div>
                  <div className="text-2xl font-extrabold text-foreground mt-2">{fmtMoney(totalMRR)}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{totalPools} pools · this month</div>
                </div>
                <div className="rounded-lg border bg-amber-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "hsl(38 92% 50%)" }} />
                    <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Tech Payouts</div>
                  </div>
                  <div className="text-2xl font-extrabold text-foreground mt-2">−{fmtMoney(totalPayouts)}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {totalMRR > 0 ? `${((totalPayouts / totalMRR) * 100).toFixed(1)}% of revenue` : "—"}
                  </div>
                </div>
                <div className="rounded-lg border bg-rose-50/50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="text-[11px] font-bold uppercase tracking-wide text-rose-700">Supplies</div>
                  </div>
                  <div className="text-2xl font-extrabold text-foreground mt-2">−{fmtMoney(suppliesTotal)}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {totalMRR > 0 ? `${((suppliesTotal / totalMRR) * 100).toFixed(1)}% of revenue` : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };



  // Day-off requests local state (mock, persists for the session).
  type DayOffStatus = "Pending" | "Approved" | "Denied" | "None";
  interface DayOffRequest { dates: string; reason: string; status: DayOffStatus }
  const defaultDayOff: DayOffRequest[] = [
    { dates: "May 23 – May 24, 2026", reason: "Family event", status: "Pending" },
    { dates: "Jun 02, 2026", reason: "Medical appointment", status: "Approved" },
    { dates: "Jun 14 – Jun 16, 2026", reason: "Vacation", status: "Pending" },
    { dates: "—", reason: "—", status: "None" },
  ];
  const [dayOffByTech, setDayOffByTech] = useState<Record<string, DayOffRequest>>({});
  const [editDayOffTechId, setEditDayOffTechId] = useState<string | null>(null);
  const [editDayOffDraft, setEditDayOffDraft] = useState<DayOffRequest>({ dates: "", reason: "", status: "Pending" });

  const DashboardPage = () => {


    // Revenue per pool size, using each homeowner's actual monthly_amount.
    // Each placeholder/active homeowner contributes their monthly_amount split
    // evenly across their pools (most have 1 pool so this is just the amount).
    const sizeBuckets: { key: "small" | "medium" | "large"; label: string; match: (s: string) => boolean }[] = [
      { key: "small", label: "Small Pool", match: (s) => /small/i.test(s) },
      { key: "medium", label: "Medium Pool", match: (s) => /medium/i.test(s) },
      { key: "large", label: "Large Pool", match: (s) => /large/i.test(s) },
    ];
    const revenueRows = sizeBuckets.map((cfg) => {
      let count = 0;
      let revenue = 0;
      for (const h of homeowners) {
        if (!h.monthlyAmount || h.pools.length === 0) continue;
        const perPool = h.monthlyAmount / h.pools.length;
        for (const p of h.pools) {
          if (cfg.match(p.size ?? "")) {
            count += 1;
            revenue += perPool;
          }
        }
      }
      const avgPrice = count > 0 ? Math.round(revenue / count) : 0;
      return { label: cfg.label, count, revenue: Math.round(revenue), price: avgPrice };
    });
    const totalMRR = revenueRows.reduce((a, r) => a + r.revenue, 0);
    const totalPools = revenueRows.reduce((a, r) => a + r.count, 0);

    // Grandfathered accounts (legacy pricing).
    const grandfatheredAccounts = homeowners.filter((h) => (h as { isGrandfathered?: boolean }).isGrandfathered);
    const grandfatheredMRR = grandfatheredAccounts.reduce((a, h) => a + (h.monthlyAmount ?? 0), 0);

    // Fred's accounts (notifications suppressed).
    const fredsAccounts = homeowners.filter((h) => (h as { isFreds?: boolean }).isFreds);
    const fredsMRR = fredsAccounts.reduce((a, h) => a + (h.monthlyAmount ?? 0), 0);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthKey = now.toISOString().slice(0, 7);

    const activeServicesToday = homeowners.reduce(
      (a, h) => a + h.services.filter((s) => s.status === "Scheduled" && (s.serviceDate ?? s.date ?? "").startsWith(todayStr)).length,
      0
    );
    const activeServicesTotal = homeowners.reduce(
      (a, h) => a + h.services.filter((s) => s.status === "Scheduled").length,
      0
    );
    const newHomeownersThisMonth = homeowners.filter((h) => (h.startDate ?? "").startsWith(monthKey)).length;
    const techsAvailable = technicians.filter((t) => t.status === "Active").length;
    const techsOnLeave = technicians.length - techsAvailable;
    const newApplicantsToday = applicants.filter((a) => (a.appliedDate ?? "").startsWith(todayStr)).length;

    const issuesUrgent = openIssueCount > 0;
    const applicantsUrgent = pendingCount > 0;

    const stats = [
      {
        label: "Monthly Revenue",
        value: fmtMoney(totalMRR),
        icon: CreditCard,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        hint: `${totalPools} active pool${totalPools === 1 ? "" : "s"} · recurring`,
        onClick: () => document.getElementById("financials-card")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      },
      {
        label: "Total Homeowners",
        value: homeowners.length,
        icon: Users,
        color: "text-primary",
        bg: "bg-blue-50",
        hint: `${newHomeownersThisMonth} new this month`,
        onClick: () => nav("homeowners"),
      },
      {
        label: "Pool Technicians",
        value: technicians.length,
        icon: Wrench,
        color: "text-violet-500",
        bg: "bg-violet-50",
        hint: `${techsAvailable} available · ${techsOnLeave} on leave`,
        onClick: () => nav("technicians"),
      },
      {
        label: "Active Services",
        value: activeServicesTotal,
        icon: Waves,
        color: "text-emerald-500",
        bg: "bg-emerald-50",
        hint: `${activeServicesToday} scheduled today`,
        onClick: () => nav("dashboard"),
      },
      {
        label: "Reported Issues",
        value: openIssueCount,
        icon: AlertCircle,
        color: issuesUrgent ? "text-amber-600" : "text-muted-foreground",
        bg: issuesUrgent ? "bg-amber-100" : "bg-muted",
        hint: issuesUrgent ? `${openIssueCount} need attention` : "All clear",
        urgent: issuesUrgent,
        onClick: () => nav("issues"),
      },
      {
        label: "Pending Applicants",
        value: pendingCount,
        icon: UserPlus,
        color: applicantsUrgent ? "text-violet-600" : "text-muted-foreground",
        bg: applicantsUrgent ? "bg-violet-100" : "bg-muted",
        hint: applicantsUrgent
          ? `${newApplicantsToday > 0 ? `${newApplicantsToday} new today · ` : ""}${pendingCount} to review`
          : "No new applications",
        urgent: applicantsUrgent,
        onClick: () => nav("applicants"),
      },
    ];

    const recentServices = homeowners.flatMap(h => h.services.map(s => ({ ...s, homeowner: h.name })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return (
      <div className="space-y-6">

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={c.onClick}
              className={`group relative text-left rounded-lg border bg-card text-card-foreground shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                c.urgent ? "border-amber-300 bg-amber-50/40" : ""
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-2xl font-extrabold text-foreground tracking-tight leading-none">{c.value}</div>
                  <div className={`w-7 h-7 rounded-md ${c.bg} flex items-center justify-center ${c.color} shrink-0 opacity-70 group-hover:opacity-100 transition-opacity`}>
                    <c.icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-xs text-foreground font-semibold mt-2">{c.label}</div>
                <div className={`text-[11px] mt-0.5 ${c.urgent ? "text-amber-700 font-medium" : "text-muted-foreground"}`}>
                  {c.hint}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div id="financials-card" className="scroll-mt-20">
          <FinancialsCard
            revenueRows={revenueRows}
            totalMRR={totalMRR}
            totalPools={totalPools}
            technicians={technicians}
            homeowners={homeowners}
          />
        </div>




        <AppointmentsCard />

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm font-bold">Route Issues</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setReportIssueOpen(true)}>
                <AlertCircle className="h-3.5 w-3.5" /> Report Issue
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reported</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-center">Affected</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(routeIssueData ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground text-xs py-8">
                      No route issues reported.
                    </TableCell>
                  </TableRow>
                ) : (routeIssueData ?? []).slice(0, 5).map((r) => {
                  const label = r.issue_type === "other" ? (r.other_text || "Other") : r.issue_type;
                  const statusStyle =
                    r.status === "active" ? "bg-amber-100 text-amber-800 border-amber-200" :
                    r.status === "pending_approval" ? "bg-blue-100 text-blue-800 border-blue-200" :
                    r.status === "resolved" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                    "bg-muted text-muted-foreground border-border";
                  return (
                    <TableRow key={r.id} onClick={() => nav("routeIssueDetail", r.id)} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap text-xs">{format(new Date(r.created_at), "MMM d, h:mm a")}</TableCell>
                      <TableCell className="capitalize">{label}</TableCell>
                      <TableCell>{r.technician_name ?? "—"}</TableCell>
                      <TableCell className="capitalize">{r.action_taken}</TableCell>
                      <TableCell className="text-center">{r.affected_service_count}</TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle}`}>
                          {r.status.replace("_", " ")}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>










        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-bold">Open Issues</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Homeowner</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {issues.filter(i => i.status === "Open").length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground text-xs py-6">No open issues</TableCell></TableRow>
                ) : issues.filter(i => i.status === "Open").map((issue, i) => (
                  <TableRow key={i} onClick={() => openIssueModal(issue)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{issue.homeowner}</TableCell><TableCell>{issue.type}</TableCell>
                    <TableCell><StatusBadge status={issue.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">Active Technicians · Day Off Requests</CardTitle>
            <div className="text-xs text-muted-foreground">
              {technicians.filter((t) => t.status === "Active").length} active
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician</TableHead>
                  <TableHead>Requested Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const actives = technicians.filter((t) => t.status === "Active");
                  if (actives.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-6">
                          No active technicians
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return actives.map((t, i) => {
                    const r: DayOffRequest = dayOffByTech[t.id] ?? defaultDayOff[i % defaultDayOff.length];
                    const setStatus = (status: DayOffStatus) => {
                      setDayOffByTech((prev) => ({ ...prev, [t.id]: { ...r, status } }));
                    };
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-semibold">{t.name}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{r.dates}</TableCell>
                        <TableCell className="text-xs">{r.reason}</TableCell>
                        <TableCell>
                          {r.status === "None" ? (
                            <span className="text-xs text-muted-foreground italic">No request</span>
                          ) : (
                            <StatusBadge status={r.status === "Denied" ? "Rejected" : r.status} />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {r.status === "Pending" && (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                  onClick={() => {
                                    setStatus("Approved");
                                    toast({ title: "Day off approved", description: `${t.name} · ${r.dates}`, variant: "success" });
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setStatus("Denied");
                                    toast({ title: "Day off denied", description: `${t.name} · ${r.dates}`, variant: "destructive" });
                                  }}
                                >
                                  Deny
                                </Button>
                              </>
                            )}
                            {r.status !== "None" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => {
                                  setEditDayOffDraft(r);
                                  setEditDayOffTechId(t.id);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {(() => {
          const standardAccounts = homeowners.filter(
            (h) => !(h as { isGrandfathered?: boolean }).isGrandfathered && !(h as { isFreds?: boolean }).isFreds,
          );
          const standardMRR = standardAccounts.reduce((a, h) => a + (h.monthlyAmount ?? 0), 0);
          const tabKey = specialTab;
          const isStd = tabKey === "standard";
          const isGF = tabKey === "grandfathered";
          const isFreds = tabKey === "freds";
          const borderClass = isGF ? "border-amber-200" : isFreds ? "border-violet-200" : "";
          const badgeClass = isGF
            ? "bg-amber-100 text-amber-700 border-amber-200"
            : isFreds
              ? "bg-violet-100 text-violet-700 border-violet-200"
              : "bg-blue-100 text-blue-700 border-blue-200";
          const badgeLabel = isGF ? "Legacy pricing" : isFreds ? "Notifications suppressed" : "Standard pricing";
          const rows = isStd ? standardAccounts : isGF ? grandfatheredAccounts : fredsAccounts;
          const totalMo = isStd ? standardMRR : isGF ? grandfatheredMRR : fredsMRR;
          const lastColLabel = isGF ? "Note" : isFreds ? "Status" : "Plan";
          const accentClass = isGF ? "text-amber-700" : isFreds ? "text-violet-700" : "text-muted-foreground";
          return (
            <Card className={borderClass}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <CardTitle className="text-sm font-bold">Homeowners</CardTitle>
                  <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
                    <button
                      onClick={() => setSpecialTab("standard")}
                      className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${isStd ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Standard ({standardAccounts.length})
                    </button>
                    <button
                      onClick={() => setSpecialTab("grandfathered")}
                      className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${isGF ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Grandfathered ({grandfatheredAccounts.length})
                    </button>
                    <button
                      onClick={() => setSpecialTab("freds")}
                      className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${isFreds ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Fred's ({fredsAccounts.length})
                    </button>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                    {badgeLabel}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {rows.length} accounts · <span className="text-foreground font-bold">{fmtMoney(totalMo)}/mo</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[360px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Pool Size</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Technician</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead>{lastColLabel}</TableHead>
                        <TableHead className="w-10 text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground text-xs py-8">
                            No {isStd ? "standard" : isGF ? "grandfathered" : "Fred's"} accounts.
                          </TableCell>
                        </TableRow>
                      ) : rows
                        .slice()
                        .sort((a, b) => (a.monthlyAmount ?? 0) - (b.monthlyAmount ?? 0))
                        .map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="font-medium">{h.name}</TableCell>
                            <TableCell className="text-xs">{h.pools[0]?.size ?? "—"}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">{h.pools[0]?.address ?? "—"}</TableCell>
                            <TableCell className="text-xs">{h.pools[0]?.technician ?? "Unassigned"}</TableCell>
                            <TableCell className="text-right font-semibold">{fmtMoney(h.monthlyAmount ?? 0)}/mo</TableCell>
                            <TableCell className={`text-xs ${accentClass}`}>
                              {isGF
                                ? ((h as { grandfatheredNote?: string | null }).grandfatheredNote ?? "Legacy rate")
                                : isFreds
                                  ? "Notifications off"
                                  : "Standard"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                aria-label={`Edit ${h.name}`}
                                onClick={() => { setEditingHomeowner(h); setEditHomeownerOpen(true); }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

    );
  };

  // ═══════════ TECHNICIANS ═══════════
  const TechniciansPage = () => {
    const filtered = technicians.filter((t) =>
      techFilter === "all" ? true : techFilter === "active" ? t.status === "Active" : t.status === "Inactive",
    );
    const counts = {
      all: technicians.length,
      active: technicians.filter((t) => t.status === "Active").length,
      inactive: technicians.filter((t) => t.status === "Inactive").length,
    };
    const toggle = (id: string, isActive: boolean) =>
      updateTechnicianActive.mutate(
        { id, isActive },
        {
          onSuccess: () =>
            toast({ title: isActive ? "Technician activated" : "Technician deactivated", variant: "success" }),
          onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
        },
      );

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
          {(["all", "active", "inactive"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTechFilter(k)}
              className={`px-3 py-1 text-xs font-semibold rounded capitalize transition-colors ${techFilter === k ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {k} ({counts[k]})
            </button>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Rating</TableHead><TableHead>Pools</TableHead><TableHead>Services</TableHead><TableHead>Reviews</TableHead><TableHead>Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground text-xs py-6">No {techFilter !== "all" ? techFilter : ""} technicians.</TableCell></TableRow>
                ) : filtered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-semibold">{t.name}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell>{t.rating > 0 ? <Stars rating={t.rating} /> : <span className="text-muted-foreground text-xs italic">New</span>}</TableCell>
                    <TableCell>{t.assignedPools} pools</TableCell><TableCell>{t.completedServices}</TableCell><TableCell>{t.reviews.length} reviews</TableCell>
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggle(t.id, t.status !== "Active")} disabled={updateTechnicianActive.isPending}>
                        {t.status === "Active" ? "Deactivate" : "Activate"}
                      </Button>
                      <Button size="sm" onClick={() => nav("techDetail", t.id)}>View Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const TechDetailPage = () => {
    const tech = technicians.find(t => t.id === detailId);
    if (!tech) return null;
    return (
      <div className="space-y-5">
        <button onClick={() => nav("technicians")} className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to Technicians
        </button>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Technician Information</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  setTechDraftName(tech.name);
                  setTechDraftEmail(tech.email);
                  setTechDraftPhone(tech.phone === "—" ? "" : tech.phone);
                  setTechDraftPayout(String(tech.payoutPerPool ?? 100));
                  setEditTechId(tech.id);
                }}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updateTechnicianActive.mutate(
                    { id: tech.id, isActive: tech.status !== "Active" },
                    {
                      onSuccess: () =>
                        toast({
                          title: tech.status === "Active" ? "Technician deactivated" : "Technician activated",
                          variant: "success",
                        }),
                    },
                  )
                }
                disabled={updateTechnicianActive.isPending}
              >
                {tech.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <InfoRow label="Name" value={tech.name} /><InfoRow label="Rating" value={tech.rating > 0 ? <Stars rating={tech.rating} /> : "New - No ratings yet"} />
            <InfoRow label="Email" value={tech.email} /><InfoRow label="Phone" value={tech.phone} /><InfoRow label="Status" value={tech.status} badge />
          </CardContent></Card>

        {(() => {
          const PAYOUT_LABEL: Record<string, string> = {
            hourly: "Hourly",
            per_service: "Per Service",
            daily: "Daily Rate",
          };
          const type = tech.payoutType ?? "per_service";
          const rate = tech.payoutRate ?? tech.payoutPerPool ?? 0;
          const updated = tech.payoutUpdatedAt
            ? new Date(tech.payoutUpdatedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
            : "—";
          const effective = tech.payoutEffectiveDate
            ? new Date(tech.payoutEffectiveDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
            : null;
          return (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Compensation</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    setCompDraftType(type);
                    setCompDraftRate(String(rate ?? ""));
                    setCompDraftEffective(tech.payoutEffectiveDate ?? "");
                    setEditCompTechId(tech.id);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Rate
                </Button>
              </CardHeader>
              <CardContent>
                <InfoRow label="Payout Type" value={PAYOUT_LABEL[type]} />
                <InfoRow label="Payout Rate" value={`$${Number(rate).toFixed(2)}`} />
                {effective && <InfoRow label="Effective Date" value={effective} />}
                <InfoRow label="Last Updated" value={updated} />
              </CardContent>
            </Card>
          );
        })()}

        <TechPoolAssignmentPanel technicianId={tech.id} />

        <TechClientUpdatesPanel technicianId={tech.id} />

        <AdminNotesPanel targetType="technician" targetId={tech.id} />

        <Card><CardHeader><CardTitle className="text-sm">Approved Reviews</CardTitle></CardHeader>
          <CardContent className="p-0">
            {tech.reviews.filter(r => r.status === "Approved").length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No approved reviews yet. Reviews left by homeowners will appear here once an admin approves them.
              </div>
            ) : (
              <Table><TableHeader><TableRow>
                <TableHead>Reviewer</TableHead><TableHead>Rating</TableHead><TableHead>Review</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>{tech.reviews.filter(r => r.status === "Approved").map((r, i) => (
                <TableRow key={i}><TableCell className="font-semibold">{r.reviewer}</TableCell><TableCell><Stars rating={r.rating} /></TableCell><TableCell className="text-muted-foreground max-w-[300px] truncate">{r.message}</TableCell><TableCell className="whitespace-nowrap">{r.date}</TableCell></TableRow>
              ))}</TableBody></Table>
            )}
          </CardContent></Card>

      </div>
    );
  };

  // ═══════════ HOMEOWNERS ═══════════
  const handleHomeownerCreated = (h: AdminHomeowner) => {
    setExtraHomeowners(prev => [h, ...prev]);
    setAddHomeownerOpen(false);
    setHomeownerSuccess(true);
    setTimeout(() => setHomeownerSuccess(false), 4000);
    nav("homeDetail", h.id);
  };

  const updateHomeownerProfile = useUpdateHomeownerProfile();

  const handleHomeownerUpdated = async (h: AdminHomeowner) => {
    const isDbBacked = fetchedHomeowners.some((x) => x.id === h.id);
    if (isDbBacked) {
      // Parse "Street, City, State, ZIP" back into parts for persistence.
      const parts = (h.address || "").split(",").map((s) => s.trim());
      const [street, city, state, zip] = [parts[0] ?? "", parts[1] ?? "", parts[2] ?? "", parts[3] ?? ""];
      try {
        await updateHomeownerProfile.mutateAsync({
          id: h.id,
          patch: {
            fullName: h.name,
            email: h.email,
            phone: h.phone || null,
            street: street || null,
            city: city || null,
            state: state || null,
            zip: zip || null,
            poolId: h.pools?.[0]?.id ?? null,
            poolSize: h.pools?.[0]?.size ?? null,
            poolAddress: h.address || null,
            isGrandfathered: h.isGrandfathered,
            grandfatheredNote: h.grandfatheredNote ?? null,
            isFreds: h.isFreds,
            notificationsEnabled: h.notificationsEnabled,
          },
        });
        toast({ title: "Homeowner updated", variant: "success" });
      } catch (e) {
        toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
        return;
      }
    } else {
      setExtraHomeowners((prev) => prev.map((x) => (x.id === h.id ? h : x)));
    }
    setEditHomeownerOpen(false);
    setEditingHomeowner(null);
    setHomeownerEditSuccess(true);
    setTimeout(() => setHomeownerEditSuccess(false), 4000);
  };

  const HomeownersPage = () => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkTechId, setBulkTechId] = useState<string>("");
    const [bulkApplying, setBulkApplying] = useState(false);
    const activeTechsHo = technicians.filter((t) => t.status === "Active");

    const isCancelledSub = (h: AdminHomeowner) =>
      h.subscriptionStatus === "cancelled" || h.subscriptionStatus === "pending_cancellation";
    const counts = {
      all: homeowners.length,
      standard: homeowners.filter((h) => {
        const x = h as { isGrandfathered?: boolean; isFreds?: boolean };
        return !x.isGrandfathered && !x.isFreds;
      }).length,
      grandfathered: homeowners.filter((h) => (h as { isGrandfathered?: boolean }).isGrandfathered).length,
      freds: homeowners.filter((h) => (h as { isFreds?: boolean }).isFreds).length,
      placeholder: homeowners.filter((h) => (h as { isPlaceholder?: boolean }).isPlaceholder).length,
      cancelled: homeowners.filter(isCancelledSub).length,
    };
    const filtered = homeowners.filter((h) => {
      const x = h as { isGrandfathered?: boolean; isFreds?: boolean; isPlaceholder?: boolean };
      switch (homeownerFilter) {
        case "standard": return !x.isGrandfathered && !x.isFreds;
        case "grandfathered": return Boolean(x.isGrandfathered);
        case "freds": return Boolean(x.isFreds);
        case "placeholder": return Boolean(x.isPlaceholder);
        case "cancelled": return isCancelledSub(h);
        default: return true;
      }
    });
    const tabs: { key: typeof homeownerFilter; label: string }[] = [
      { key: "all", label: "All" },
      { key: "standard", label: "Standard" },
      { key: "grandfathered", label: "Grandfathered" },
      { key: "freds", label: "Fred's" },
      { key: "placeholder", label: "Placeholder" },
      { key: "cancelled", label: "Cancelled" },
    ];


    const assignableSelected = filtered.filter((h) => selectedIds.has(h.id) && h.pools?.[0]?.id);
    const allAssignableIds = filtered.filter((h) => h.pools?.[0]?.id).map((h) => h.id);
    const allSelected = allAssignableIds.length > 0 && allAssignableIds.every((id) => selectedIds.has(id));
    const someSelected = selectedIds.size > 0 && !allSelected;

    const toggleOne = (id: string, checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) next.add(id); else next.delete(id);
        return next;
      });
    };
    const toggleAll = (checked: boolean) => {
      setSelectedIds(checked ? new Set(allAssignableIds) : new Set());
    };

    const assignRow = async (h: AdminHomeowner, techId: string | null) => {
      const pool = h.pools?.[0];
      try {
        if (pool?.id) {
          await assignPoolToTech.mutateAsync({ poolId: pool.id, technicianId: techId });
        } else {
          // New customer: create a pool record from their profile and assign in one step
          await assignTechToHomeowner.mutateAsync({ homeownerId: h.id, technicianId: techId });
        }
        toast({ title: techId ? "Technician assigned" : "Technician unassigned", variant: "success" });
      } catch (e) {
        toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
      }
    };

    const bulkAssign = async () => {
      if (!bulkTechId || assignableSelected.length === 0) return;
      setBulkApplying(true);
      const techId = bulkTechId === "none" ? null : bulkTechId;
      let ok = 0, fail = 0;
      for (const h of assignableSelected) {
        try {
          await assignPoolToTech.mutateAsync({ poolId: h.pools[0].id!, technicianId: techId });
          ok++;
        } catch { fail++; }
      }
      setBulkApplying(false);
      setSelectedIds(new Set());
      setBulkTechId("");
      toast({
        title: `Updated ${ok} homeowner${ok === 1 ? "" : "s"}${fail ? `, ${fail} failed` : ""}`,
        variant: fail ? "destructive" : "success",
      });
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">{filtered.length} of {homeowners.length} homeowners</p>
            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setHomeownerFilter(t.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${homeownerFilter === t.key ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {t.label} ({counts[t.key]})
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => setAddHomeownerOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Homeowner
          </Button>
        </div>
        {homeownerSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
            <Check className="h-4 w-4" /> Homeowner added successfully
          </div>
        )}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-md border border-border bg-muted/40">
            <p className="text-sm font-medium">
              {selectedIds.size} selected
              {assignableSelected.length !== selectedIds.size && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({assignableSelected.length} assignable)
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Select value={bulkTechId} onValueChange={setBulkTechId}>
                <SelectTrigger className="h-9 w-56 text-xs">
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {activeTechsHo.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={bulkAssign}
                disabled={!bulkTechId || assignableSelected.length === 0 || bulkApplying}
              >
                {bulkApplying ? "Applying…" : "Apply to selected"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        )}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={(v) => toggleAll(Boolean(v))}
                        aria-label="Select all homeowners"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Pool Size</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground text-xs py-8">
                        No homeowners in this view.
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((h) => {
                    const pool = h.pools?.[0];
                    const isGF = Boolean((h as { isGrandfathered?: boolean }).isGrandfathered);
                    const isPlaceholder = Boolean((h as { isPlaceholder?: boolean }).isPlaceholder);
                    const isFreds = Boolean((h as { isFreds?: boolean }).isFreds);
                    const hasTech = Boolean(pool?.technicianId);
                    const hasPool = Boolean(pool?.id);
                    const canAssign = true; // Admin can always assign — pool is auto-created if missing
                    const stop = (e: React.MouseEvent) => e.stopPropagation();
                    return (
                      <TableRow
                        key={h.id}
                        onClick={() => nav("homeDetail", h.id)}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                      >
                        <TableCell onClick={stop} className="w-10">
                          <Checkbox
                            checked={selectedIds.has(h.id)}
                            onCheckedChange={(v) => toggleOne(h.id, Boolean(v))}
                            disabled={!hasPool}
                            aria-label={`Select ${h.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium">{h.name}</span>
                            {isPlaceholder && (
                              <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Placeholder
                              </span>
                            )}
                            {isGF && (
                              <span className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                GF
                              </span>
                            )}
                            {isFreds && (
                              <span title="Fred's account — notifications suppressed" className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-200">
                                Fred's
                              </span>
                            )}
                            {h.subscriptionStatus === "cancelled" && (
                              <span title="Membership cancelled" className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">
                                Cancelled
                              </span>
                            )}
                            {h.subscriptionStatus === "pending_cancellation" && (
                              <span title="Cancellation scheduled" className="inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                Pending Cancel
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{h.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{h.phone || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{h.address}</TableCell>
                        <TableCell className="text-xs">{pool?.size ?? "—"}</TableCell>
                        <TableCell className="text-xs" onClick={stop}>
                          {canAssign ? (
                            <Select
                              value={pool?.technicianId ?? "none"}
                              onValueChange={(v) => assignRow(h, v === "none" ? null : v)}
                            >
                              <SelectTrigger className={`h-8 w-48 text-xs ${!hasTech ? "border-amber-300 bg-amber-50/50" : ""}`}>
                                <SelectValue placeholder="Assign technician" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-muted-foreground">Unassigned</span>
                                </SelectItem>
                                {activeTechsHo.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground">{pool?.technician ?? "—"}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-xs">
                          {h.monthlyAmount ? fmtMoney(h.monthlyAmount) : "—"}
                        </TableCell>
                        <TableCell className="text-right" onClick={stop}>
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => { setEditingHomeowner(h); setEditHomeownerOpen(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => nav("homeDetail", h.id)}
                            >
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };


  const HomeDetailPage = () => {
    const ho = homeowners.find(h => h.id === detailId);
    if (!ho) return null;
    const upcoming = ho.services.filter(s => s.status === "Scheduled");
    const past = ho.services.filter(s => s.status === "Completed");
    const visibleServices = scheduleTab === "upcoming" ? upcoming : past;

    const TabBtn = ({ id, label }: { id: typeof detailTab; label: string }) => (
      <button
        onClick={() => setDetailTab(id)}
        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
          detailTab === id
            ? "bg-sky-100 text-sky-800 shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
      </button>
    );

    return (
      <div className="space-y-5">
        <button onClick={() => nav("homeowners")} className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to Homeowners
        </button>

        {homeownerEditSuccess && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium">
            <Check className="h-4 w-4" /> Changes saved successfully
          </div>
        )}

        {/* Header */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {ho.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{ho.name}</h2>
                    <StatusBadge status={
                      ho.subscriptionStatus === "cancelled" ? "Cancelled"
                        : ho.subscriptionStatus === "pending_cancellation" ? "Pending Cancellation"
                        : (ho.status || "Active")
                    } />
                    {ho.manuallyAdded && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">Manually Added</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 space-x-3">
                    <span>{ho.email}</span><span>•</span><span>{ho.phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => { setEditingHomeowner(ho); setEditHomeownerOpen(true); }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit Homeowner
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Service Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <div className="p-3 rounded-md border border-border bg-muted/30">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Waves className="h-3.5 w-3.5" /> Pools</div>
                <div className="text-sm font-semibold mt-1">{ho.pools.length} {ho.pools.length === 1 ? "Pool" : "Pools"}</div>
              </div>
              <div className="p-3 rounded-md border border-border bg-muted/30">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> Frequency</div>
                <div className="text-sm font-semibold mt-1">{ho.frequency || "Weekly"}</div>
              </div>
              <div className="p-3 rounded-md border border-border bg-muted/30">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><BadgeCheck className="h-3.5 w-3.5" /> Plan</div>
                <div className="text-sm font-semibold mt-1">{ho.plan}</div>
              </div>
              <div className="p-3 rounded-md border border-border bg-muted/30">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CreditCard className="h-3.5 w-3.5" /> Payment</div>
                <div className="text-sm font-semibold mt-1">{ho.paymentMethod || "Card on File"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="border-b border-border flex gap-1 overflow-x-auto">
          <TabBtn id="overview" label="Overview" />
          <TabBtn id="pools" label="Pools" />
          <TabBtn id="schedule" label="History" />
          <TabBtn id="requests" label="Requests" />
          <TabBtn id="billing" label="Billing" />
          <TabBtn id="membership" label="Membership" />
          <TabBtn id="services" label="Services" />
          <TabBtn id="notes" label="Notes" />
        </div>

        {detailTab === "overview" && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Homeowner Information</CardTitle></CardHeader>
              <CardContent>
                <InfoRow label="Name" value={ho.name} /><InfoRow label="Email" value={ho.email} /><InfoRow label="Phone" value={ho.phone} />
                <InfoRow label="Address" value={ho.address} /><InfoRow label="Plan" value={ho.plan} /><InfoRow label="Start Date" value={ho.startDate} />
              </CardContent>
            </Card>
            <HomeownerPricingPanel homeownerId={ho.id} monthlyAmount={ho.monthlyAmount} />
          </div>
        )}

        {detailTab === "pools" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pools & Assigned Technician</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Address</TableHead><TableHead>Size</TableHead><TableHead>Assigned Technician</TableHead><TableHead>Next Service</TableHead>
                </TableRow></TableHeader>
                <TableBody>{ho.pools.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                    No pools on file for this homeowner yet. Pools are added automatically once the customer completes onboarding.
                  </TableCell></TableRow>
                ) : ho.pools.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold">{p.address}</TableCell>
                    <TableCell>{p.size}</TableCell>
                    <TableCell>
                      {p.id ? (
                        <Select
                          value={p.technicianId ?? "none"}
                          onValueChange={async (val) => {
                            try {
                              await assignPoolToTech.mutateAsync({ poolId: p.id!, technicianId: val === "none" ? null : val });
                              toast({ title: "Technician reassigned", variant: "success" });
                            } catch (e) {
                              toast({ title: "Failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 w-56"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {technicians.map((t) => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        p.technician
                      )}
                    </TableCell>
                    <TableCell>{p.nextService}</TableCell>
                  </TableRow>
                ))}</TableBody>

              </Table>
            </CardContent>
          </Card>
        )}

        {detailTab === "schedule" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Service History</CardTitle>
              <div className="flex gap-1 p-1 rounded-md bg-muted">
                <button onClick={() => setScheduleTab("upcoming")} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${scheduleTab === "upcoming" ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Upcoming</button>
                <button onClick={() => setScheduleTab("past")} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${scheduleTab === "past" ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Past</button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Technician</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {visibleServices.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No {scheduleTab} services.</TableCell></TableRow>
                  ) : visibleServices.map((s, i) => (
                    <TableRow key={i} className={scheduleTab === "past" ? "cursor-pointer hover:bg-muted/50" : ""} onClick={() => { if (scheduleTab === "past" && s.id) setPastServiceId(s.id); }}>
                      <TableCell className="font-semibold">{s.date}</TableCell>
                      <TableCell>{s.type}</TableCell>
                      <TableCell>{s.technician}</TableCell>
                      <TableCell><StatusBadge status={s.status} /></TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {scheduleTab === "upcoming" ? (
                          <Button size="sm" variant="outline" onClick={() => s.id && setEditServiceId(s.id)}>Edit</Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => s.id && setPastServiceId(s.id)}>View</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {detailTab === "requests" && <HomeownerRequestsPanel homeownerId={ho.id} />}

        {detailTab === "billing" && (
          <div className="space-y-4">
            <HomeownerPricingPanel homeownerId={ho.id} monthlyAmount={ho.monthlyAmount} />
            <HomeownerBillingPanel homeownerId={ho.id} />
          </div>
        )}

        {detailTab === "membership" && (
          <div className="space-y-4">
            <HomeownerPricingPanel homeownerId={ho.id} monthlyAmount={ho.monthlyAmount} />
            <MembershipPanel homeowner={ho} />
          </div>
        )}

        {detailTab === "services" && (
          <HomeownerServicesPanel homeownerId={ho.id} monthlyAmount={ho.monthlyAmount} />
        )}

        {detailTab === "notes" && <AdminNotesPanel targetType="homeowner" targetId={ho.id} title="Admin Notes (Private)" />}
      </div>
    );
  };

  // ═══════════ APPLICANTS ═══════════
  const ApplicantsPage = () => {
    const [applicantTab, setApplicantTab] = useState<"pending" | "approved" | "rejected">("pending");
    const pendingApplicants = applicants.filter(a => a.status === "Pending");
    const approvedApplicants = applicants.filter(a => a.status === "approved");
    const rejectedApplicants = applicants.filter(a => a.status === "rejected");
    const visibleApplicants = applicantTab === "pending" ? pendingApplicants : applicantTab === "approved" ? approvedApplicants : rejectedApplicants;

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {([
            { key: "pending", label: "Pending", count: pendingApplicants.length, color: "bg-amber-500" },
            { key: "approved", label: "Approved", count: approvedApplicants.length, color: "bg-emerald-500" },
            { key: "rejected", label: "Rejected", count: rejectedApplicants.length, color: "bg-destructive" },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setApplicantTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors flex items-center gap-2 ${applicantTab === t.key ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:border-foreground/40"}`}
            >
              {t.label}
              <span className={`${t.color} text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center`}>{t.count}</span>
            </button>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>City</TableHead><TableHead>Experience</TableHead>
                  <TableHead>Resume</TableHead><TableHead>Certs</TableHead><TableHead>Applied</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {visibleApplicants.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No {applicantTab} applications.</TableCell></TableRow>
                  ) : visibleApplicants.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-semibold whitespace-nowrap">{a.firstName} {a.lastName}</TableCell>
                      <TableCell>{a.email}</TableCell>
                      <TableCell className="whitespace-nowrap">{a.phone}</TableCell>
                      <TableCell className="whitespace-nowrap">{a.city}, {a.state}</TableCell>
                      <TableCell className="whitespace-nowrap">{a.experience}</TableCell>
                      <TableCell><span className="text-primary font-semibold text-xs cursor-pointer inline-flex items-center gap-1"><FileText className="h-3 w-3" /> View</span></TableCell>
                      <TableCell>
                        {a.certifications.length > 0 ? (
                          <button
                            onClick={() => setCertModalData({ name: `${a.firstName} ${a.lastName}`, certs: a.certifications })}
                            className="text-primary font-semibold text-xs cursor-pointer inline-flex items-center gap-1 hover:underline"
                          >
                            <FileText className="h-3 w-3" /> {a.certifications.length} uploaded
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{a.appliedDate}</TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1.5 flex-nowrap">
                          <Button size="sm" variant="outline" onClick={() => nav("applicantDetail", a.id)}>View</Button>
                          {a.status === "Pending" && <>
                            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setConfirmAction({ type: "approve", applicant: a })}><Check className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive hover:text-white" onClick={() => setConfirmAction({ type: "reject", applicant: a })}><X className="h-3.5 w-3.5" /></Button>
                          </>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const ApplicantDetailPage = () => {
    const a = applicants.find(ap => ap.id === detailId);
    if (!a) return null;
    const FileLink = ({ name, file, bucket }: { name: string; file: string; bucket: "resumes" | "certifications" }) => {
      const [busy, setBusy] = useState<null | "view" | "download">(null);
      const displayName = file ? file.split("/").pop() : "";
      const openSigned = async (mode: "view" | "download") => {
        if (!file) {
          toast({ title: "No file uploaded", variant: "destructive" });
          return;
        }
        setBusy(mode);
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(file, 300, mode === "download" ? { download: displayName || true } : undefined);
          if (error || !data?.signedUrl) throw error ?? new Error("Could not create signed URL");
          window.open(data.signedUrl, "_blank", "noopener");
        } catch (e) {
          toast({ title: "Unable to open file", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
        } finally {
          setBusy(null);
        }
      };
      return (
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-2 gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><FileText className="h-4 w-4" /></div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{displayName || "No file uploaded"}</div>
            </div>
          </div>
          {file && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5" disabled={busy !== null} onClick={() => openSigned("view")}>
                <FileText className="h-3.5 w-3.5" /> {busy === "view" ? "Opening…" : "View"}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={busy !== null} onClick={() => openSigned("download")}>
                <Download className="h-3.5 w-3.5" /> {busy === "download" ? "…" : "Download"}
              </Button>
            </div>
          )}
        </div>
      );
    };
    return (
      <div className="space-y-5">
        <button onClick={() => nav("applicants")} className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to Applicants
        </button>
        {/* Status bar */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <StatusBadge status={a.status} />
              <span className="text-sm text-muted-foreground">
                {a.status === "Pending" && "This application is awaiting review."}
                {a.status === "Approved" && "This applicant has been approved and added as a technician."}
                {a.status === "Rejected" && "This application has been rejected."}
              </span>
            </div>
            {a.status === "Pending" && (
              <div className="flex gap-2">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" size="sm" disabled={approveTechnician.isPending} onClick={() => setConfirmAction({ type: "approve", applicant: a })}>
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button size="sm" className="bg-red-600 text-white hover:bg-red-700 gap-1.5" onClick={() => setConfirmAction({ type: "reject", applicant: a })}><X className="h-3.5 w-3.5" /> Reject</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated credentials card — only shown after approval */}
        {a.status === "Approved" && a.generatedEmail && a.generatedPassword && (
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                <Check className="h-4 w-4" /> Technician Account Credentials
              </CardTitle>
              <p className="text-xs text-muted-foreground">These credentials were generated when the application was approved. Share them securely with the technician.</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-2.5 gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Login Email</p>
                  <p className="text-sm font-mono font-medium">{a.generatedEmail}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(a.generatedEmail!); toast({ title: "Copied", variant: "success" }); }}>Copy</Button>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-2.5 gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Temporary Password</p>
                  <p className="text-sm font-mono font-medium">{a.generatedPassword}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(a.generatedPassword!); toast({ title: "Copied", variant: "success" }); }}>Copy</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card><CardHeader><CardTitle className="text-sm">Personal Details</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="First Name" value={a.firstName} /><InfoRow label="Last Name" value={a.lastName} />
            <InfoRow label="Email" value={a.email} /><InfoRow label="Phone" value={a.phone} />
            <InfoRow label="Applied" value={a.appliedDate} />
          </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Service Area</CardTitle></CardHeader>
          <CardContent><InfoRow label="City" value={a.city} /><InfoRow label="State" value={a.state} /><InfoRow label="ZIP Code" value={a.zip} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Experience</CardTitle></CardHeader>
          <CardContent><InfoRow label="Years" value={a.experience} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Resume</CardTitle></CardHeader>
          <CardContent>
            {a.resume
              ? <FileLink name="Resume" file={a.resume} bucket="resumes" />
              : <p className="text-sm text-muted-foreground py-4">No resume uploaded.</p>}
          </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Certifications</CardTitle></CardHeader>
          <CardContent>
            {a.certifications.length > 0 ? a.certifications.map((cert, i) => <FileLink key={i} name={cert.name} file={cert.file} bucket="certifications" />)
              : <p className="text-sm text-muted-foreground py-4">No certifications uploaded.</p>}
          </CardContent></Card>
        {a.status === "Pending" && (
          <div className="flex gap-3 justify-end">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" onClick={() => setConfirmAction({ type: "approve", applicant: a })}><Check className="h-4 w-4" /> Approve Technician</Button>
            <Button className="bg-red-600 text-white hover:bg-red-700 gap-1.5" onClick={() => setConfirmAction({ type: "reject", applicant: a })}><X className="h-4 w-4" /> Reject Application</Button>
          </div>
        )}
      </div>
    );
  };

  // ═══════════ ISSUES ═══════════
  const IssuesPage = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Homeowner</TableHead><TableHead>Type</TableHead><TableHead>Message</TableHead><TableHead>Date</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {issues.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No issues reported.</TableCell></TableRow>
            ) : issues.map(issue => (
              <TableRow key={issue.id} onClick={() => openIssueModal(issue)} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-semibold">{issue.homeowner}</TableCell><TableCell>{issue.type}</TableCell>
                <TableCell className="max-w-[220px] truncate text-muted-foreground">{issue.message}</TableCell>
                <TableCell className="whitespace-nowrap">{issue.serviceDate}</TableCell><TableCell>{issue.email}</TableCell>
                <TableCell><StatusBadge status={issue.status} /></TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openIssueModal(issue)}>View</Button>
                    {issue.status === "Open" && <Button size="sm" className="gap-1.5" onClick={() => handleResolveIssue(issue.id)}><Check className="h-3.5 w-3.5" /> Resolve</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  // ═══════════ REVIEWS MODERATION ═══════════
  const ReviewsPage = () => {
    const reviews = allReviews;
    const filtered = reviewFilter === "All" ? reviews : reviews.filter(r => r.status === reviewFilter);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-1 rounded-md bg-muted p-0.5 flex-wrap">
          {(["All", "Pending", "Approved", "Rejected"] as const).map(f => (
            <button key={f} onClick={() => setReviewFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${reviewFilter === f ? "bg-sky-100 text-sky-800 shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {f}
              {f !== "All" && (
                <span className="ml-1.5 text-[10px] bg-sky-200/50 px-1.5 py-0.5 rounded-full">
                  {reviews.filter(r => r.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Reviewer</TableHead><TableHead>Technician</TableHead><TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No reviews found.</TableCell></TableRow>
                  ) : filtered.map(r => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setReviewDetailModal(r)}>
                      <TableCell className="font-semibold">{r.reviewer}</TableCell>
                      <TableCell>{r.technicianName}</TableCell>
                      <TableCell><Stars rating={r.rating} /></TableCell>
                      <TableCell className="text-muted-foreground max-w-[250px] truncate">{r.message}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1.5 flex-nowrap" onClick={(e) => e.stopPropagation()}>
                          {r.status === "Pending" && (
                            <>
                              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1" onClick={() => handleApproveReview(r.id)}>
                                <Check className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10 gap-1" onClick={() => { setRejectReviewModal(r); setRejectionReason(""); }}>
                                <X className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          )}
                          {r.status === "Rejected" && r.rejectionReason && (
                            <span className="text-xs text-muted-foreground italic capitalize">{r.rejectionReason}</span>
                          )}
                          {r.status === "Approved" && (
                            <span className="text-xs text-muted-foreground italic">Visible</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ═══════════ PAGE ROUTER ═══════════
  const LoadingState = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );

  const renderPage = () => {
    if (isLoading) return <LoadingState />;
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "technicians":
        return technicians.length === 0
          ? <Card><CardContent className="p-0"><EmptyState
              icon={Wrench}
              title="No technicians on the roster"
              description="Approve a pending applicant to add your first technician, or seed demo data to explore the dashboard."
              actionLabel="Review Applicants"
              onAction={() => nav("applicants")}
            /></CardContent></Card>
          : <TechniciansPage />;
      case "techDetail": return <TechDetailPage />;
      case "homeowners": return <HomeownersPage />;
      case "homeDetail": return <HomeDetailPage />;
      case "issues": return <IssuesPage />;
      case "routeIssues": return <RouteIssuesListPage onOpen={(id) => nav("routeIssueDetail", id)} />;
      case "routeIssueDetail":
        return detailId
          ? <RouteIssueDetailPage issueId={detailId} onBack={() => nav("routeIssues")} />
          : <RouteIssuesListPage onOpen={(id) => nav("routeIssueDetail", id)} />;
      case "timeOff":
      case "timeOffDetail":
        return <TimeOffPage
          detailId={page === "timeOffDetail" ? detailId : null}
          onOpen={(id) => nav("timeOffDetail", id)}
          onBack={() => nav("timeOff")}
        />;
      case "reviews": return <ReviewsPage />;
      case "applicants":
        return applicants.length === 0
          ? <Card><CardContent className="p-0"><EmptyState
              icon={UserPlus}
              title="No technician applications yet"
              description="When candidates apply through the public Apply page, you'll be able to review their info, resume, and certifications here."
            /></CardContent></Card>
          : <ApplicantsPage />;
      case "applicantDetail": return <ApplicantDetailPage />;
      case "addons": return <AddonsManagementPage />;
      case "serviceCatalog": return <ServiceCatalogPage />;

      default: return <DashboardPage />;
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="md:ml-[250px]">
        <TopNav />
        <main className="p-6">{renderPage()}</main>
      </div>

      {/* Issue Detail Modal */}
      <Dialog open={!!issueModal} onOpenChange={() => setIssueModal(null)}>
        <DialogContent className="sm:max-w-[560px] pt-10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
            <DialogDescription>Update status, assign a technician, and add resolution notes.</DialogDescription>
          </DialogHeader>
          {issueModal && (
            <div className="space-y-4">
              <div>
                <InfoRow label="Homeowner" value={issueModal.homeowner} />
                <InfoRow label="Email" value={issueModal.email} />
                <InfoRow label="Phone" value={issueModal.phone} />
                <InfoRow label="Issue Type" value={issueModal.type} />
                <InfoRow label="Service Date" value={issueModal.serviceDate} />
              </div>
              <div className="p-3.5 bg-muted rounded-lg text-sm text-foreground leading-relaxed">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Message</div>
                {issueModal.message}
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg text-xs text-blue-600 font-medium">Related: {issueModal.relatedService}</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Status</label>
                  <Select value={issueDraftStatus} onValueChange={(v) => setIssueDraftStatus(v as typeof issueDraftStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Assign Technician</label>
                  <Select value={issueDraftTechId || "unassigned"} onValueChange={(v) => setIssueDraftTechId(v === "unassigned" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {technicians.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Admin Notes / Resolution Details</label>
                <Textarea rows={4} value={issueDraftNotes} onChange={(e) => setIssueDraftNotes(e.target.value)} placeholder="What was done, who took action, follow-up needed…" />
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <Button variant="outline" onClick={() => setIssueModal(null)}>Cancel</Button>
                <Button className="gap-1.5" onClick={handleSaveIssue} disabled={updateIssueStatus.isPending}>
                  <Check className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Service Modal */}
      <Dialog open={!!editServiceId} onOpenChange={(open) => !open && setEditServiceId(null)}>
        <DialogContent className="sm:max-w-[520px] pt-10 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>Reassign technician, change date, time window, or status.</DialogDescription>
          </DialogHeader>
          {editServiceQuery.isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {editServiceQuery.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Status</label>
                  <Select value={svcDraftStatus} onValueChange={(v) => setSvcDraftStatus(v as typeof svcDraftStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Technician</label>
                  <Select value={svcDraftTechId || "unassigned"} onValueChange={(v) => setSvcDraftTechId(v === "unassigned" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {technicians.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Service Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-normal">
                        {svcDraftDate ? format(svcDraftDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={svcDraftDate} onSelect={setSvcDraftDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Time Window</label>
                  <Select value={svcDraftWindow} onValueChange={(v) => setSvcDraftWindow(v as typeof svcDraftWindow)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8am – 12pm)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12pm – 4pm)</SelectItem>
                      <SelectItem value="evening">Evening (4pm – 8pm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5">
                Service: <span className="font-semibold text-foreground">{editServiceQuery.data.serviceType}</span> · {editServiceQuery.data.hours}h
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setEditServiceId(null)}>Cancel</Button>
                <Button onClick={handleSaveService} disabled={updateService.isPending} className="gap-1.5">
                  <Check className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Approve/Reject Modal */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="sm:max-w-[440px]">
          {confirmAction && (() => {
            const isApprove = confirmAction.type === "approve";
            const a = confirmAction.applicant;
            return (
              <>
                <DialogHeader>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${isApprove ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}>
                    {isApprove ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
                  </div>
                  <DialogTitle>{isApprove ? "Approve Technician" : "Reject Application"}</DialogTitle>
                  <DialogDescription>
                    {isApprove
                      ? `Are you sure you want to approve ${a.firstName} ${a.lastName}? This will create a new technician account.`
                      : `Are you sure you want to reject ${a.firstName} ${a.lastName}'s application?`}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={approveTechnician.isPending}>Cancel</Button>
                  {isApprove
                    ? <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" disabled={approveTechnician.isPending} onClick={() => handleApprove(a)}>
                        <Check className="h-4 w-4" /> {approveTechnician.isPending ? "Creating account…" : "Approve"}
                      </Button>
                    : <Button variant="destructive" className="gap-1.5" onClick={() => handleReject(a)}><X className="h-4 w-4" /> Reject</Button>}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Rejection Email Modal */}
      <Dialog open={!!rejectionEmailApplicant} onOpenChange={(open) => !open && setRejectionEmailApplicant(null)}>
        <DialogContent className="max-w-[520px] pt-10">
          <DialogHeader>
            <DialogTitle>Send Rejection Email</DialogTitle>
            <DialogDescription>
              Notify the applicant about the rejection. You can edit the message before sending.
            </DialogDescription>
          </DialogHeader>
          {rejectionEmailApplicant && (
            <div className="space-y-4 mt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">To</label>
                <Input value={rejectionEmailApplicant.email} readOnly className="bg-muted/50 text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                <Input value={rejectionEmailSubject} onChange={(e) => setRejectionEmailSubject(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Message</label>
                <Textarea value={rejectionEmailBody} onChange={(e) => setRejectionEmailBody(e.target.value)} rows={6} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectionEmailApplicant(null)}>Cancel</Button>
            <Button className="gap-1.5" onClick={handleSendRejectionEmail}>
              <Mail className="h-4 w-4" /> Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approved Technician Credentials Modal */}
      <Dialog open={!!approvedCredentials} onOpenChange={(open) => !open && setApprovedCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 bg-emerald-50 text-emerald-500">
              <Check className="h-6 w-6" />
            </div>
            <DialogTitle>Account Created Successfully</DialogTitle>
            <DialogDescription>
              A technician account has been created for {approvedCredentials?.name}. Share these credentials securely.
            </DialogDescription>
          </DialogHeader>
          {approvedCredentials && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-border bg-muted/40 divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Login Email</p>
                    <p className="text-sm font-mono font-medium mt-0.5">{approvedCredentials.email}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0" onClick={() => { navigator.clipboard.writeText(approvedCredentials.email); toast({ title: "Email copied", variant: "success" }); }}>
                    Copy
                  </Button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Temporary Password</p>
                    <p className="text-sm font-mono font-medium mt-0.5">{approvedCredentials.password}</p>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0" onClick={() => { navigator.clipboard.writeText(approvedCredentials.password); toast({ title: "Password copied", variant: "success" }); }}>
                    Copy
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                The technician should log in and change their password. Credentials are also saved on their applicant record.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setApprovedCredentials(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Detail Modal */}
      <Dialog open={!!reviewDetailModal} onOpenChange={(open) => !open && setReviewDetailModal(null)}>
        <DialogContent className="max-w-[520px] pt-10">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>Full review information</DialogDescription>
          </DialogHeader>
          {reviewDetailModal && (
            <div className="space-y-1 mt-1">
              <InfoRow label="Reviewer" value={reviewDetailModal.reviewer} />
              <InfoRow label="Technician" value={reviewDetailModal.technicianName} />
              <InfoRow label="Rating" value={<Stars rating={reviewDetailModal.rating} />} />
              <InfoRow label="Date" value={reviewDetailModal.date} />
              <InfoRow label="Status" value={reviewDetailModal.status} badge />
              <div className="pt-3">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Review</div>
                <div className="p-4 bg-muted/50 rounded-xl border border-border text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  "{reviewDetailModal.message}"
                </div>
              </div>
              {reviewDetailModal.status === "Pending" && (
                <div className="flex gap-2 justify-end pt-4">
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" onClick={() => { handleApproveReview(reviewDetailModal.id); setReviewDetailModal({ ...reviewDetailModal, status: "Approved" }); }}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10 gap-1.5" onClick={() => { setReviewDetailModal(null); setRejectReviewModal(reviewDetailModal); setRejectionReason(""); }}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Review Modal */}
      <Dialog open={!!rejectReviewModal} onOpenChange={() => { setRejectReviewModal(null); setRejectionReason(""); }}>
        <DialogContent className="sm:max-w-[440px]">
          {rejectReviewModal && (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 bg-red-50 text-red-500">
                  <X className="h-6 w-6" />
                </div>
                <DialogTitle>Reject Review</DialogTitle>
                <DialogDescription>
                  Reject the review from <strong>{rejectReviewModal.reviewer}</strong> for <strong>{rejectReviewModal.technicianName}</strong>?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 py-2">
                <label className="text-sm font-medium text-foreground">Reason (optional)</label>
                <Select value={rejectionReason} onValueChange={(v) => setRejectionReason(v as ReviewRejectionReason)}>
                  <SelectTrigger><SelectValue placeholder="Select a reason..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                    <SelectItem value="irrelevant">Irrelevant Feedback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => { setRejectReviewModal(null); setRejectionReason(""); }}>Cancel</Button>
                <Button variant="destructive" className="gap-1.5" onClick={() => handleRejectReview(rejectReviewModal.id, rejectionReason)}>
                  <X className="h-4 w-4" /> Reject Review
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Certificates Modal */}
      <Dialog open={!!certModalData} onOpenChange={(open) => !open && setCertModalData(null)}>
        <DialogContent className="max-w-[520px] pt-10">
          <DialogHeader>
            <DialogTitle>Certificates - {certModalData?.name}</DialogTitle>
            <DialogDescription>
              {certModalData?.certs.length} certificate{(certModalData?.certs.length || 0) > 1 ? "s" : ""} uploaded. Click a file to open it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {certModalData?.certs.map((cert, i) => (
              <button
                key={i}
                onClick={() => toast({ title: "Opening certificate", description: `${cert.file} would open in a new tab.` })}
                className="w-full flex items-center gap-3 p-3.5 bg-muted/50 rounded-xl border border-border hover:bg-muted transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{cert.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{cert.file}</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Route Issue Modal */}
      <ReportRouteIssueModal
        open={reportIssueOpen}
        onOpenChange={setReportIssueOpen}
        role="admin"
        services={homeowners.flatMap((h) =>
          h.services.map((s) => ({
            id: s.id ?? "",
            homeowner: h.name,
            type: s.type,
            time: s.date,
          }))
        ).filter((s) => !!s.id) as RouteService[]}
        technicians={technicians.map((t) => ({ id: t.id, name: t.name }))}
      />


      <AddHomeownerModal
        open={addHomeownerOpen}
        onClose={() => setAddHomeownerOpen(false)}
        onCreate={handleHomeownerCreated}
      />

      <EditHomeownerModal
        open={editHomeownerOpen}
        onClose={() => { setEditHomeownerOpen(false); setEditingHomeowner(null); }}
        homeowner={editingHomeowner}
        onSave={handleHomeownerUpdated}
      />
      <PastServiceDetailModal serviceId={pastServiceId} onClose={() => setPastServiceId(null)} />

      <Dialog open={!!editTechId} onOpenChange={(o) => !o && setEditTechId(null)}>
        <DialogContent className="pt-10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit technician</DialogTitle>
            <DialogDescription>Update the technician's contact details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Full name</label>
              <Input value={techDraftName} onChange={(e) => setTechDraftName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <Input type="email" value={techDraftEmail} onChange={(e) => setTechDraftEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Phone</label>
              <Input value={techDraftPhone} onChange={(e) => setTechDraftPhone(e.target.value)} placeholder="(407) 555-0000" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Payout per pool ($)</label>
              <Input type="number" min="0" step="1" value={techDraftPayout} onChange={(e) => setTechDraftPayout(e.target.value)} placeholder="100" />
              <p className="text-[11px] text-muted-foreground">Amount paid to this technician for each pool serviced per month.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTechId(null)}>Cancel</Button>
            <Button
              disabled={updateTechnicianProfile.isPending || !techDraftName.trim()}
              onClick={async () => {
                if (!editTechId) return;
                try {
                  const payoutNum = Number(techDraftPayout);
                  await updateTechnicianProfile.mutateAsync({
                    id: editTechId,
                    patch: {
                      fullName: techDraftName.trim(),
                      email: techDraftEmail.trim(),
                      phone: techDraftPhone.trim() || null,
                      payoutPerPool: Number.isFinite(payoutNum) && payoutNum >= 0 ? payoutNum : 100,
                    },
                  });
                  toast({ title: "Technician updated", variant: "success" });
                  setEditTechId(null);
                } catch (e) {
                  toast({ title: "Update failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
                }
              }}
            >
              {updateTechnicianProfile.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Compensation */}
      <Dialog open={!!editCompTechId} onOpenChange={(o) => { if (!o) { setEditCompTechId(null); setCompError(null); } }}>
        <DialogContent className="pt-10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit compensation</DialogTitle>
            <DialogDescription>Update this technician's payout type and rate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Payout type</label>
              <Select value={compDraftType} onValueChange={(v) => setCompDraftType(v as typeof compDraftType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="per_service">Per Service</SelectItem>
                  <SelectItem value="daily">Daily Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Payout rate ($)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={compDraftRate}
                onChange={(e) => setCompDraftRate(e.target.value)}
                placeholder="25.00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Effective date (optional)</label>
              <Input
                type="date"
                value={compDraftEffective}
                onChange={(e) => setCompDraftEffective(e.target.value)}
              />
            </div>
            {compError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {compError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditCompTechId(null); setCompError(null); }}>Cancel</Button>
            <Button
              disabled={updateTechnicianCompensation.isPending || !compDraftRate.trim() || Number(compDraftRate) < 0 || Number.isNaN(Number(compDraftRate))}
              onClick={async () => {
                if (!editCompTechId) return;
                setCompError(null);
                try {
                  await updateTechnicianCompensation.mutateAsync({
                    id: editCompTechId,
                    patch: {
                      payoutType: compDraftType,
                      payoutRate: Number(compDraftRate),
                      payoutEffectiveDate: compDraftEffective || null,
                    },
                  });
                  toast({ title: "Technician payout rate updated successfully.", variant: "success" });
                  setEditCompTechId(null);
                  setCompError(null);
                } catch (e) {
                  setCompError(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              {updateTechnicianCompensation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Day Off Request */}
      <Dialog open={!!editDayOffTechId} onOpenChange={(o) => !o && setEditDayOffTechId(null)}>
        <DialogContent className="pt-10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Day Off Request</DialogTitle>
            <DialogDescription>Update the dates, reason, or status for this request.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Dates</label>
              <Input
                value={editDayOffDraft.dates}
                onChange={(e) => setEditDayOffDraft((d) => ({ ...d, dates: e.target.value }))}
                placeholder="e.g. Jun 14 – Jun 16, 2026"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Reason</label>
              <Textarea
                value={editDayOffDraft.reason}
                onChange={(e) => setEditDayOffDraft((d) => ({ ...d, reason: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Status</label>
              <Select
                value={editDayOffDraft.status}
                onValueChange={(v) => setEditDayOffDraft((d) => ({ ...d, status: v as DayOffStatus }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDayOffTechId(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!editDayOffTechId) return;
                setDayOffByTech((prev) => ({ ...prev, [editDayOffTechId]: editDayOffDraft }));
                toast({ title: "Request updated", variant: "success" });
                setEditDayOffTechId(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
