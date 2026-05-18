import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Database } from "lucide-react";
import {
  LayoutDashboard, Wrench, Users, AlertCircle, UserPlus, ChevronLeft,
  Star, Mail, Check, X, LogOut, User, Menu, FileText, Download, Waves, MessageSquare, Megaphone,
  Plus, MoreHorizontal, Pencil, CalendarClock, CreditCard, BadgeCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import oasisLogo from "@/assets/oo-logo.png";
import AddHomeownerModal from "@/components/admin/AddHomeownerModal";
import EditHomeownerModal from "@/components/admin/EditHomeownerModal";
import AdminNotesPanel from "@/components/admin/AdminNotesPanel";
import TechPoolAssignmentPanel from "@/components/admin/TechPoolAssignmentPanel";
import TechClientUpdatesPanel from "@/components/admin/TechClientUpdatesPanel";
import HomeownerBillingPanel from "@/components/admin/HomeownerBillingPanel";
import HomeownerRequestsPanel from "@/components/admin/HomeownerRequestsPanel";
import PastServiceDetailModal from "@/components/admin/PastServiceDetailModal";
import ReportRouteIssueModal, { type RouteService } from "@/components/ReportRouteIssueModal";
import type {
  AdminTechnician, AdminApplicant, AdminApplicantCert, AdminIssue,
  AdminTechReview, ReviewStatus, ReviewRejectionReason, AdminHomeowner,
} from "@/types/admin";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminTechnicians, useAdminHomeowners, useAdminIssues,
  useTechnicianApplications, useUpdateIssueStatus, useUpdateApplicationStatus,
  useUpdateTechnicianActive, useUpdateTechnicianProfile, useUpdateHomeownerProfile,
  useToggleFredsTag,
} from "@/hooks/useAdmin";
import { useReviews, useUpdateReviewStatus } from "@/hooks/useReviews";
import { useService, useUpdateService } from "@/hooks/useServices";
import { useAssignPoolToTech } from "@/hooks/useAdminDetails";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

type AdminPage = "dashboard" | "technicians" | "techDetail" | "homeowners" | "homeDetail" | "issues" | "applicants" | "applicantDetail" | "reviews";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  technicians: "Pool Technicians",
  techDetail: "Technician Details",
  homeowners: "Homeowners",
  homeDetail: "Homeowner Details",
  issues: "Reported Issues",
  applicants: "Applicants",
  applicantDetail: "Application Details",
  reviews: "Review Moderation",
};

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
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  // Live data from Supabase
  const techniciansQuery = useAdminTechnicians();
  const homeownersQuery = useAdminHomeowners();
  const issuesQuery = useAdminIssues();
  const applicationsQuery = useTechnicianApplications();
  const reviewsQuery = useReviews();
  const updateIssueStatus = useUpdateIssueStatus();
  const updateApplicationStatus = useUpdateApplicationStatus();
  const updateReviewStatus = useUpdateReviewStatus();
  const assignPoolToTech = useAssignPoolToTech();
  const updateTechnicianActive = useUpdateTechnicianActive();
  const updateTechnicianProfile = useUpdateTechnicianProfile();
  const toggleFredsTag = useToggleFredsTag();
  const [techFilter, setTechFilter] = useState<"all" | "active" | "inactive">("all");
  const [editTechId, setEditTechId] = useState<string | null>(null);
  const [techDraftName, setTechDraftName] = useState("");
  const [techDraftEmail, setTechDraftEmail] = useState("");
  const [techDraftPhone, setTechDraftPhone] = useState("");

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
    phone: t.phone ?? "—",
    status: t.status,
    assignedPools: t.assignedPools,
    completedServices: t.completedServices,
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
    phone: h.phone ?? "—",
    address: h.address,
    plan: h.plan,
    startDate: h.startDate,
    monthlyAmount: h.monthlyAmount,
    isGrandfathered: h.isGrandfathered,
    isPlaceholder: h.isPlaceholder,
    grandfatheredNote: h.grandfatheredNote,
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
    serviceDate: i.serviceDate ?? "—",
    email: i.email,
    phone: i.phone ?? "—",
    status: i.status === "open" ? "Open" : i.status === "in_progress" ? "In Progress" : "Resolved",
    relatedService: i.relatedService ?? "—",
    adminNotes: i.adminNotes,
    assignedTechnicianId: i.assignedTechnicianId,
  }));

  const applicants: AdminApplicant[] = (applicationsQuery.data ?? []).map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    email: a.email,
    phone: a.phone ?? "—",
    city: a.city ?? "—",
    state: a.state ?? "—",
    zip: a.zip ?? "—",
    experience: a.experience ?? "—",
    resume: a.resumeUrl ?? "",
    certifications: a.certifications.map((c) => ({
      name: c.name,
      file: c.fileUrl ?? "",
    })),
    appliedDate: a.appliedDate,
    status: (a.status.charAt(0).toUpperCase() + a.status.slice(1)) as AdminApplicant["status"],
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

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo", {
        body: user?.id ? { linkExtraToUserId: user.id } : {},
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Seed failed");
      toast({
        title: "Demo data seeded",
        description: `${data.counts.pools} pools · ${data.counts.services} services · ${data.counts.reviews} reviews`,
      });
      await queryClient.invalidateQueries();
    } catch (e) {
      toast({
        title: "Seed failed",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

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
  const [detailTab, setDetailTab] = useState<"overview" | "pools" | "schedule" | "requests" | "billing" | "notes">("overview");
  const [pastServiceId, setPastServiceId] = useState<string | null>(null);

  const nav = (p: AdminPage, id: string | null = null) => { setPage(p); setDetailId(id); setSidebarOpen(false); };

  const handleApprove = async (applicant: AdminApplicant) => {
    try {
      await updateApplicationStatus.mutateAsync({ id: applicant.id, status: "approved" });
      setConfirmAction(null);
      toast({ title: "Applicant Approved", description: `${applicant.firstName} ${applicant.lastName} approved.`, variant: "success" });
      if (page === "applicantDetail") nav("applicants");
    } catch (e) {
      toast({ title: "Approve failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  const DEFAULT_REJECTION_MESSAGE = "Thank you for applying for the position. We appreciate the time and effort you put into your application. After careful review, we have decided to move forward with another candidate at this time. We wish you the best in your job search and future opportunities.";

  const handleReject = async (applicant: AdminApplicant) => {
    try {
      await updateApplicationStatus.mutateAsync({ id: applicant.id, status: "rejected" });
      setConfirmAction(null);
      setRejectionEmailApplicant(applicant);
      setRejectionEmailSubject("Thank you for applying");
      setRejectionEmailBody(DEFAULT_REJECTION_MESSAGE);
      if (page === "applicantDetail") nav("applicants");
    } catch (e) {
      toast({ title: "Reject failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    }
  };

  const handleSendRejectionEmail = () => {
    if (!rejectionEmailApplicant) return;
    toast({ title: "Email Sent", description: `Rejection email sent to ${rejectionEmailApplicant.email}.`, variant: "success" });
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


  const menuItems = [
    { key: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { key: "technicians" as const, label: "Technicians", icon: Wrench },
    { key: "homeowners" as const, label: "Homeowners", icon: Users },
    { key: "reviews" as const, label: "Reviews", icon: MessageSquare, badge: pendingReviewCount, badgeColor: "bg-amber-500" },
    { key: "applicants" as const, label: "Applicants", icon: UserPlus, badge: pendingCount, badgeColor: "bg-violet-500" },
    { key: "issues" as const, label: "Reported Issues", icon: AlertCircle, badge: openIssueCount, badgeColor: "bg-destructive" },
  ];

  const activeMenu = page === "techDetail" ? "technicians" : page === "homeDetail" ? "homeowners" : page === "applicantDetail" ? "applicants" : page;

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
    type Row = {
      id: string; date: Date; dateLabel: string; homeowner: string; address: string;
      poolSize: string; type: string; status: string; technicianId: string | null; technicianName: string;
      isGrandfathered: boolean; grandfatheredNote: string | null;
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

    const handleAssign = async (serviceId: string, techId: string) => {
      try {
        const newTech = techId === "unassigned" ? null : techId;
        const { error } = await supabase.from("services").update({ technician_id: newTech }).eq("id", serviceId);
        if (error) throw error;
        await queryClient.invalidateQueries({ queryKey: ["services"] });
        await queryClient.invalidateQueries({ queryKey: ["admin-homeowners"] });
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
            <CardTitle className="text-sm font-bold">Appointments</CardTitle>
            <div className="flex items-center gap-1 rounded-md bg-muted p-0.5">
              <button
                onClick={() => setApptTab("upcoming")}
                className={`px-3 py-1 text-xs font-semibold rounded ${apptTab === "upcoming" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                Upcoming ({upcoming.length})
              </button>
              <button
                onClick={() => setApptTab("past")}
                className={`px-3 py-1 text-xs font-semibold rounded ${apptTab === "past" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                Past ({past.length})
              </button>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setReportIssueOpen(true)}>
            <AlertCircle className="h-3.5 w-3.5" /> Report Issue
          </Button>
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
                <TableRow key={r.id}>
                  <TableCell className="font-medium whitespace-nowrap">{r.dateLabel}</TableCell>
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
                  <TableCell>
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

  // ═══════════ DASHBOARD PAGE ═══════════
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

    const now = new Date();
    const fmtMoney = (n: number) =>
      n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    const stats = [
      { label: "Monthly Revenue", value: fmtMoney(totalMRR), icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
      { label: "Total Homeowners", value: homeowners.length, icon: Users, color: "text-primary", bg: "bg-blue-50" },
      { label: "Pool Technicians", value: technicians.length, icon: Wrench, color: "text-violet-500", bg: "bg-violet-50" },
      { label: "Active Services", value: homeowners.reduce((a, h) => a + h.services.filter(s => s.status === "Scheduled").length, 0), icon: Waves, color: "text-emerald-500", bg: "bg-emerald-50" },
      { label: "Reported Issues", value: openIssueCount, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
      { label: "Pending Applicants", value: pendingCount, icon: UserPlus, color: "text-violet-500", bg: "bg-violet-50" },
    ];

    const recentServices = homeowners.flatMap(h => h.services.map(s => ({ ...s, homeowner: h.name })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSeedDemo} disabled={seeding}>
            <Database className="h-3.5 w-3.5" />
            {seeding ? "Seeding…" : "Seed demo data"}
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((c, i) => (
            <Card key={i}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center ${c.color} shrink-0`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-foreground tracking-tight">{c.value}</div>
                  <div className="text-xs text-muted-foreground font-medium mt-1">{c.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold">
              Monthly Revenue by Service · {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </CardTitle>
            <div className="text-xs text-muted-foreground">
              Total <span className="ml-1 text-foreground font-bold">{fmtMoney(totalMRR)}</span> · {totalPools} pools
            </div>
          </CardHeader>
          <CardContent>
            {totalPools === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-10">No pools on file yet.</div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueRows} margin={{ top: 24, right: 16, left: 8, bottom: 8 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(v) => `$${v}`}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={56}
                    />
                    <ReTooltip
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                      formatter={(value: number, _name, p) => [fmtMoney(value), `${p.payload.count} pools × ${fmtMoney(p.payload.price)}`]}
                      labelStyle={{ fontWeight: 600 }}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                      {revenueRows.map((_, i) => (
                        <Cell key={i} fill={["hsl(var(--primary))", "hsl(199 89% 48%)", "hsl(173 80% 40%)"][i % 3]} />
                      ))}
                      <LabelList
                        dataKey="revenue"
                        position="top"
                        formatter={(v: number) => (v > 0 ? fmtMoney(v) : "")}
                        style={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--foreground))" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {grandfatheredAccounts.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold">Grandfathered Accounts</CardTitle>
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                  Legacy pricing
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {grandfatheredAccounts.length} accounts · <span className="text-foreground font-bold">{fmtMoney(grandfatheredMRR)}/mo</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Pool Size</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grandfatheredAccounts.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.name}</TableCell>
                      <TableCell className="text-xs">{h.pools[0]?.size ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{h.pools[0]?.address ?? "—"}</TableCell>
                      <TableCell className="font-semibold">{fmtMoney(h.monthlyAmount ?? 0)}/mo</TableCell>
                      <TableCell className="text-xs text-amber-700">
                        {(h as { grandfatheredNote?: string | null }).grandfatheredNote ?? "Legacy rate"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <AppointmentsCard />

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold">Homeowners</CardTitle>
              <span className="text-xs text-muted-foreground">{homeowners.length} total</span>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddHomeownerOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Homeowner
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {homeowners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground text-xs py-8">
                        No homeowners yet.
                      </TableCell>
                    </TableRow>
                  ) : homeowners.map((h) => {
                    const pool = h.pools?.[0];
                    const isGF = Boolean((h as { isGrandfathered?: boolean }).isGrandfathered);
                    const isPlaceholder = Boolean((h as { isPlaceholder?: boolean }).isPlaceholder);
                    return (
                      <TableRow key={h.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
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
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{h.email}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{h.phone || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{h.address}</TableCell>
                        <TableCell className="text-xs">{pool?.size ?? "—"}</TableCell>
                        <TableCell className="text-xs">{pool?.technician ?? "Unassigned"}</TableCell>
                        <TableCell className="text-right font-semibold text-xs">
                          {h.monthlyAmount ? fmtMoney(h.monthlyAmount) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
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
                  // Mock day-off requests, deterministic by tech index
                  const samples = [
                    { dates: "May 23 – May 24, 2026", reason: "Family event", status: "Pending" },
                    { dates: "Jun 02, 2026", reason: "Medical appointment", status: "Approved" },
                    { dates: "Jun 14 – Jun 16, 2026", reason: "Vacation", status: "Pending" },
                    { dates: "—", reason: "—", status: "None" },
                  ];
                  return actives.map((t, i) => {
                    const r = samples[i % samples.length];
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-semibold">{t.name}</TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{r.dates}</TableCell>
                        <TableCell className="text-xs">{r.reason}</TableCell>
                        <TableCell>
                          {r.status === "None" ? (
                            <span className="text-xs text-muted-foreground italic">No request</span>
                          ) : (
                            <StatusBadge status={r.status} />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {r.status === "Pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toast({ title: "Day off approved", description: `${t.name} · ${r.dates}`, variant: "success" })}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toast({ title: "Day off denied", description: `${t.name} · ${r.dates}`, variant: "destructive" })}
                                >
                                  Deny
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={() => {
                                setTechDraftName(t.name);
                                setTechDraftEmail(t.email);
                                setTechDraftPhone(t.phone === "—" || !t.phone ? "" : t.phone);
                                setEditTechId(t.id);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
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
        <div className="flex items-center gap-2">
          {(["all", "active", "inactive"] as const).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={techFilter === k ? "default" : "outline"}
              onClick={() => setTechFilter(k)}
              className="capitalize"
            >
              {k} ({counts[k]})
            </Button>
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

        <TechPoolAssignmentPanel technicianId={tech.id} />

        <TechClientUpdatesPanel technicianId={tech.id} />

        <AdminNotesPanel targetType="technician" targetId={tech.id} />

        {tech.reviews.filter(r => r.status === "Approved").length > 0 && (
          <Card><CardHeader><CardTitle className="text-sm">Approved Reviews</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow>
                <TableHead>Reviewer</TableHead><TableHead>Rating</TableHead><TableHead>Review</TableHead><TableHead>Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>{tech.reviews.filter(r => r.status === "Approved").map((r, i) => (
                <TableRow key={i}><TableCell className="font-semibold">{r.reviewer}</TableCell><TableCell><Stars rating={r.rating} /></TableCell><TableCell className="text-muted-foreground max-w-[300px] truncate">{r.message}</TableCell><TableCell className="whitespace-nowrap">{r.date}</TableCell></TableRow>
              ))}</TableBody></Table>
            </CardContent></Card>
        )}
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

  const HomeownersPage = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{homeowners.length} total homeowners</p>
        <Button onClick={() => setAddHomeownerOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Homeowner
        </Button>
      </div>
      {homeownerSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <Check className="h-4 w-4" /> Homeowner added successfully
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Pools</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {homeowners.map(h => (
                <TableRow
                  key={h.id}
                  onClick={() => nav("homeDetail", h.id)}
                  className="cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      {h.name}
                      {h.manuallyAdded && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">Manually Added</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{h.email}</TableCell><TableCell>{h.phone}</TableCell>
                  <TableCell>{h.pools.length}</TableCell><TableCell><StatusBadge status={h.status || "Active"} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  const HomeDetailPage = () => {
    const ho = homeowners.find(h => h.id === detailId);
    if (!ho) return null;
    const upcoming = ho.services.filter(s => s.status === "Scheduled");
    const past = ho.services.filter(s => s.status === "Completed");
    const visibleServices = scheduleTab === "upcoming" ? upcoming : past;

    const TabBtn = ({ id, label }: { id: typeof detailTab; label: string }) => (
      <button
        onClick={() => setDetailTab(id)}
        className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
          detailTab === id
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
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
                    <StatusBadge status={ho.status || "Active"} />
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
          <TabBtn id="notes" label="Notes" />
        </div>

        {detailTab === "overview" && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Homeowner Information</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Name" value={ho.name} /><InfoRow label="Email" value={ho.email} /><InfoRow label="Phone" value={ho.phone} />
              <InfoRow label="Address" value={ho.address} /><InfoRow label="Plan" value={ho.plan} /><InfoRow label="Start Date" value={ho.startDate} />
            </CardContent>
          </Card>
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
                <TableBody>{ho.pools.map((p, i) => (
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
                <button onClick={() => setScheduleTab("upcoming")} className={`px-3 py-1 text-xs font-medium rounded ${scheduleTab === "upcoming" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Upcoming</button>
                <button onClick={() => setScheduleTab("past")} className={`px-3 py-1 text-xs font-medium rounded ${scheduleTab === "past" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Past</button>
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

        {detailTab === "billing" && <HomeownerBillingPanel homeownerId={ho.id} />}

        {detailTab === "notes" && <AdminNotesPanel targetType="homeowner" targetId={ho.id} title="Admin Notes (Private)" />}
      </div>
    );
  };

  // ═══════════ APPLICANTS ═══════════
  const ApplicantsPage = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>City</TableHead><TableHead>Experience</TableHead>
              <TableHead>Resume</TableHead><TableHead>Certs</TableHead><TableHead>Applied</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {applicants.map(a => (
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
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => setConfirmAction({ type: "reject", applicant: a })}><X className="h-3.5 w-3.5" /></Button>
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
  );

  const ApplicantDetailPage = () => {
    const a = applicants.find(ap => ap.id === detailId);
    if (!a) return null;
    const FileLink = ({ name, file }: { name: string; file: string }) => (
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><FileText className="h-4 w-4" /></div>
          <div><div className="text-sm font-semibold text-foreground">{name}</div><div className="text-[11px] text-muted-foreground">{file}</div></div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> View File</Button>
      </div>
    );
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
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" size="sm" onClick={() => setConfirmAction({ type: "approve", applicant: a })}><Check className="h-3.5 w-3.5" /> Approve</Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10 gap-1.5" onClick={() => setConfirmAction({ type: "reject", applicant: a })}><X className="h-3.5 w-3.5" /> Reject</Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="text-sm">Personal Details</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="First Name" value={a.firstName} /><InfoRow label="Last Name" value={a.lastName} />
            <InfoRow label="Email" value={a.email} /><InfoRow label="Phone" value={a.phone} />
          </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Service Area</CardTitle></CardHeader>
          <CardContent><InfoRow label="City" value={a.city} /><InfoRow label="State" value={a.state} /><InfoRow label="ZIP Code" value={a.zip} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Experience</CardTitle></CardHeader>
          <CardContent><InfoRow label="Years" value={a.experience} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Resume</CardTitle></CardHeader>
          <CardContent><FileLink name="Resume" file={a.resume} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Certifications</CardTitle></CardHeader>
          <CardContent>
            {a.certifications.length > 0 ? a.certifications.map((cert, i) => <FileLink key={i} name={cert.name} file={cert.file} />)
              : <p className="text-sm text-muted-foreground py-4">No certifications uploaded.</p>}
          </CardContent></Card>
        {a.status === "Pending" && (
          <div className="flex gap-3 justify-end">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" onClick={() => setConfirmAction({ type: "approve", applicant: a })}><Check className="h-4 w-4" /> Approve Technician</Button>
            <Button variant="outline" className="text-destructive border-destructive/40 hover:bg-destructive/10 gap-1.5" onClick={() => setConfirmAction({ type: "reject", applicant: a })}><X className="h-4 w-4" /> Reject Application</Button>
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
        <div className="flex items-center gap-2 flex-wrap">
          {(["All", "Pending", "Approved", "Rejected"] as const).map(f => (
            <Button key={f} size="sm" variant={reviewFilter === f ? "default" : "outline"} onClick={() => setReviewFilter(f)}>
              {f}
              {f !== "All" && (
                <span className="ml-1.5 text-[10px] bg-background/20 px-1.5 py-0.5 rounded-full">
                  {reviews.filter(r => r.status === f).length}
                </span>
              )}
            </Button>
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
          ? <Card><CardContent className="text-center py-12 text-sm text-muted-foreground">No technicians yet. Approve an applicant or seed demo data to get started.</CardContent></Card>
          : <TechniciansPage />;
      case "techDetail": return <TechDetailPage />;
      case "homeowners": return <HomeownersPage />;
      case "homeDetail": return <HomeDetailPage />;
      case "issues": return <IssuesPage />;
      case "reviews": return <ReviewsPage />;
      case "applicants":
        return applicants.length === 0
          ? <Card><CardContent className="text-center py-12 text-sm text-muted-foreground">No technician applications yet.</CardContent></Card>
          : <ApplicantsPage />;
      case "applicantDetail": return <ApplicantDetailPage />;
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
                  <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                  {isApprove
                    ? <Button className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" onClick={() => handleApprove(a)}><Check className="h-4 w-4" /> Approve</Button>
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
          h.services.slice(0, 1).map((s, idx) => ({
            id: `${h.id}-${idx}`,
            homeowner: h.name,
            type: s.type,
            time: s.date,
          }))
        ) as RouteService[]}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTechId(null)}>Cancel</Button>
            <Button
              disabled={updateTechnicianProfile.isPending || !techDraftName.trim()}
              onClick={async () => {
                if (!editTechId) return;
                try {
                  await updateTechnicianProfile.mutateAsync({
                    id: editTechId,
                    patch: { fullName: techDraftName.trim(), email: techDraftEmail.trim(), phone: techDraftPhone.trim() || null },
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
    </div>
  );
};

export default AdminDashboard;
