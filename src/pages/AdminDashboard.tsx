import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import ReportRouteIssueModal, { type RouteService } from "@/components/ReportRouteIssueModal";
import {
  INIT_TECHNICIANS, ADMIN_HOMEOWNERS, ADMIN_ISSUES, INIT_APPLICANTS,
  type AdminTechnician, type AdminApplicant, type AdminApplicantCert, type AdminIssue, type AdminTechReview, type ReviewStatus, type ReviewRejectionReason, type AdminHomeowner,
} from "@/data/adminMockData";

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
  const [detailId, setDetailId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [issueModal, setIssueModal] = useState<AdminIssue | null>(null);
  const [technicians, setTechnicians] = useState(INIT_TECHNICIANS);
  const [applicants, setApplicants] = useState(INIT_APPLICANTS);
  const [confirmAction, setConfirmAction] = useState<{ type: "approve" | "reject"; applicant: AdminApplicant } | null>(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reviewFilter, setReviewFilter] = useState<"All" | ReviewStatus>("All");
  const [rejectReviewModal, setRejectReviewModal] = useState<AdminTechReview | null>(null);
  const [rejectionReason, setRejectionReason] = useState<ReviewRejectionReason>("");
  const [reviewDetailModal, setReviewDetailModal] = useState<AdminTechReview | null>(null);

  const [certModalData, setCertModalData] = useState<{ name: string; certs: AdminApplicantCert[] } | null>(null);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);

  const [rejectionEmailApplicant, setRejectionEmailApplicant] = useState<AdminApplicant | null>(null);
  const [rejectionEmailSubject, setRejectionEmailSubject] = useState("");
  const [rejectionEmailBody, setRejectionEmailBody] = useState("");

  // Homeowners
  const [homeowners, setHomeowners] = useState<AdminHomeowner[]>(ADMIN_HOMEOWNERS);
  const [addHomeownerOpen, setAddHomeownerOpen] = useState(false);
  const [editHomeownerOpen, setEditHomeownerOpen] = useState(false);
  const [editingHomeowner, setEditingHomeowner] = useState<AdminHomeowner | null>(null);
  const [homeownerSuccess, setHomeownerSuccess] = useState(false);
  const [homeownerEditSuccess, setHomeownerEditSuccess] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<"upcoming" | "past">("upcoming");
  const [detailTab, setDetailTab] = useState<"overview" | "pools" | "schedule" | "payments" | "notes">("overview");

  const nav = (p: AdminPage, id: number | null = null) => { setPage(p); setDetailId(id); setSidebarOpen(false); };

  const handleApprove = (applicant: AdminApplicant) => {
    setApplicants(prev => prev.map(a => a.id === applicant.id ? { ...a, status: "Approved" as const } : a));
    const newTech: AdminTechnician = {
      id: Date.now(), name: `${applicant.firstName} ${applicant.lastName.charAt(0)}.`,
      rating: 0, email: applicant.email, phone: applicant.phone, status: "Active",
      assignedPools: 0, completedServices: 0, reviews: [], pools: [],
    };
    setTechnicians(prev => [...prev, newTech]);
    setConfirmAction(null);
    toast({ title: "Applicant Approved", description: `${applicant.firstName} ${applicant.lastName} approved and added as a technician.`, variant: "success" });
    if (page === "applicantDetail") nav("applicants");
  };

  const DEFAULT_REJECTION_MESSAGE = "Thank you for applying for the position. We appreciate the time and effort you put into your application. After careful review, we have decided to move forward with another candidate at this time. We wish you the best in your job search and future opportunities.";

  const handleReject = (applicant: AdminApplicant) => {
    setApplicants(prev => prev.map(a => a.id === applicant.id ? { ...a, status: "Rejected" as const } : a));
    setConfirmAction(null);
    // Open the rejection email modal
    setRejectionEmailApplicant(applicant);
    setRejectionEmailSubject("Thank you for applying");
    setRejectionEmailBody(DEFAULT_REJECTION_MESSAGE);
    if (page === "applicantDetail") nav("applicants");
  };

  const handleSendRejectionEmail = () => {
    if (!rejectionEmailApplicant) return;
    toast({ title: "Email Sent", description: `Rejection email sent to ${rejectionEmailApplicant.email}.`, variant: "success" });
    setRejectionEmailApplicant(null);
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const allReviews = technicians.flatMap(t => t.reviews);
  const pendingReviewCount = allReviews.filter(r => r.status === "Pending").length;

  const handleApproveReview = (reviewId: number) => {
    setTechnicians(prev => prev.map(t => ({
      ...t,
      reviews: t.reviews.map(r => r.id === reviewId ? { ...r, status: "Approved" as const } : r),
    })));
    toast({ title: "Review Approved", description: "The review is now publicly visible.", variant: "success" });
  };

  const handleRejectReview = (reviewId: number, reason: ReviewRejectionReason) => {
    setTechnicians(prev => prev.map(t => ({
      ...t,
      reviews: t.reviews.map(r => r.id === reviewId ? { ...r, status: "Rejected" as const, rejectionReason: reason } : r),
    })));
    setRejectReviewModal(null);
    setRejectionReason("");
    toast({ title: "Review Rejected", description: "The review has been rejected and hidden from public view.", variant: "destructive" });
  };

  const pendingCount = applicants.filter(a => a.status === "Pending").length;
  const openIssueCount = ADMIN_ISSUES.filter(i => i.status === "Open").length;

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

  // ═══════════ DASHBOARD PAGE ═══════════
  const DashboardPage = () => {
    const stats = [
      { label: "Total Homeowners", value: ADMIN_HOMEOWNERS.length, icon: Users, color: "text-primary", bg: "bg-blue-50" },
      { label: "Pool Technicians", value: technicians.length, icon: Wrench, color: "text-violet-500", bg: "bg-violet-50" },
      { label: "Active Services", value: ADMIN_HOMEOWNERS.reduce((a, h) => a + h.services.filter(s => s.status === "Scheduled").length, 0), icon: Waves, color: "text-emerald-500", bg: "bg-emerald-50" },
      { label: "Reported Issues", value: openIssueCount, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-50" },
      { label: "Pending Applicants", value: pendingCount, icon: UserPlus, color: "text-violet-500", bg: "bg-violet-50" },
    ];

    const recentServices = ADMIN_HOMEOWNERS.flatMap(h => h.services.map(s => ({ ...s, homeowner: h.name })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
             <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Services Today</CardTitle>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { setAnnouncementOpen(true); setAnnouncementTitle(""); setAnnouncementMessage(""); setAnnouncementSent(false); }}>
                <Megaphone className="h-3.5 w-3.5" /> Create Announcement
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Homeowner</TableHead><TableHead>Service</TableHead><TableHead>Technician</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {recentServices.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{r.homeowner}</TableCell><TableCell>{r.type}</TableCell><TableCell>{r.technician}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  ))}
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
                  {ADMIN_ISSUES.filter(i => i.status === "Open").map((issue, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{issue.homeowner}</TableCell><TableCell>{issue.type}</TableCell>
                      <TableCell><StatusBadge status={issue.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ═══════════ TECHNICIANS ═══════════
  const TechniciansPage = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead><TableHead>Rating</TableHead><TableHead>Pools</TableHead><TableHead>Services</TableHead><TableHead>Reviews</TableHead><TableHead>Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {technicians.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-semibold">{t.name}</TableCell>
                <TableCell>{t.rating > 0 ? <Stars rating={t.rating} /> : <span className="text-muted-foreground text-xs italic">New</span>}</TableCell>
                <TableCell>{t.assignedPools} pools</TableCell><TableCell>{t.completedServices}</TableCell><TableCell>{t.reviews.length} reviews</TableCell>
                <TableCell><Button size="sm" onClick={() => nav("techDetail", t.id)}>View Details</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const TechDetailPage = () => {
    const tech = technicians.find(t => t.id === detailId);
    if (!tech) return null;
    return (
      <div className="space-y-5">
        <button onClick={() => nav("technicians")} className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to Technicians
        </button>
        <Card><CardHeader><CardTitle className="text-sm">Technician Information</CardTitle></CardHeader>
          <CardContent>
            <InfoRow label="Name" value={tech.name} /><InfoRow label="Rating" value={tech.rating > 0 ? <Stars rating={tech.rating} /> : "New - No ratings yet"} />
            <InfoRow label="Email" value={tech.email} /><InfoRow label="Phone" value={tech.phone} /><InfoRow label="Status" value={tech.status} badge />
          </CardContent></Card>
        {tech.pools.length > 0 && (
          <Card><CardHeader><CardTitle className="text-sm">Assigned Pools</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader><TableRow>
                <TableHead>Address</TableHead><TableHead>Homeowner</TableHead><TableHead>Next Service</TableHead><TableHead>Type</TableHead>
              </TableRow></TableHeader>
              <TableBody>{tech.pools.map((p, i) => (
                <TableRow key={i}><TableCell className="font-semibold">{p.address}</TableCell><TableCell>{p.homeowner}</TableCell><TableCell>{p.nextService}</TableCell><TableCell>{p.serviceType}</TableCell></TableRow>
              ))}</TableBody></Table>
            </CardContent></Card>
        )}
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
        {tech.pools.length === 0 && tech.reviews.length === 0 && (
          <Card><CardContent className="text-center py-10 text-muted-foreground text-sm">This technician is newly approved and has no assigned pools or reviews yet.</CardContent></Card>
        )}
      </div>
    );
  };

  // ═══════════ HOMEOWNERS ═══════════
  const handleHomeownerCreated = (h: AdminHomeowner) => {
    setHomeowners(prev => [h, ...prev]);
    setAddHomeownerOpen(false);
    setHomeownerSuccess(true);
    setTimeout(() => setHomeownerSuccess(false), 4000);
    nav("homeDetail", h.id);
  };

  const handleHomeownerUpdated = (h: AdminHomeowner) => {
    setHomeowners(prev => prev.map(x => x.id === h.id ? h : x));
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
        <div className="border-b border-border flex gap-1">
          <TabBtn id="overview" label="Overview" />
          <TabBtn id="pools" label="Pools" />
          <TabBtn id="schedule" label="Schedule" />
          <TabBtn id="payments" label="Payments" />
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Pools</CardTitle>
              <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Add Pool</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Address</TableHead><TableHead>Size</TableHead><TableHead>Technician</TableHead><TableHead>Next Service</TableHead>
                </TableRow></TableHeader>
                <TableBody>{ho.pools.map((p, i) => (
                  <TableRow key={i} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-semibold">{p.address}</TableCell>
                    <TableCell>{p.size}</TableCell>
                    <TableCell>{p.technician}</TableCell>
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
              <CardTitle className="text-sm">Schedule</CardTitle>
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
                    <TableRow key={i}>
                      <TableCell className="font-semibold">{s.date}</TableCell>
                      <TableCell>{s.type}</TableCell>
                      <TableCell>{s.technician}</TableCell>
                      <TableCell><StatusBadge status={s.status} /></TableCell>
                      <TableCell>
                        {scheduleTab === "upcoming" && (
                          <Button size="sm" variant="outline">Reschedule</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {detailTab === "payments" && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Payments</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Payment method: <span className="font-medium text-foreground">{ho.paymentMethod || "Card on File"}</span></p>
              <p className="text-xs text-muted-foreground mt-2">Manual payment logging available for offline customers.</p>
            </CardContent>
          </Card>
        )}

        {detailTab === "notes" && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">{ho.notes || "No notes for this homeowner."}</p>
            </CardContent>
          </Card>
        )}
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
            {ADMIN_ISSUES.map(issue => (
              <TableRow key={issue.id}>
                <TableCell className="font-semibold">{issue.homeowner}</TableCell><TableCell>{issue.type}</TableCell>
                <TableCell className="max-w-[220px] truncate text-muted-foreground">{issue.message}</TableCell>
                <TableCell className="whitespace-nowrap">{issue.serviceDate}</TableCell><TableCell>{issue.email}</TableCell>
                <TableCell><StatusBadge status={issue.status} /></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIssueModal(issue)}><Mail className="h-3.5 w-3.5" /> Reply</Button>
                    {issue.status === "Open" && <Button size="sm" className="gap-1.5"><Check className="h-3.5 w-3.5" /> Resolve</Button>}
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
    const reviews = technicians.flatMap(t => t.reviews);
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
  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "technicians": return <TechniciansPage />;
      case "techDetail": return <TechDetailPage />;
      case "homeowners": return <HomeownersPage />;
      case "homeDetail": return <HomeDetailPage />;
      case "issues": return <IssuesPage />;
      case "reviews": return <ReviewsPage />;
      case "applicants": return <ApplicantsPage />;
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Issue Details</DialogTitle>
          </DialogHeader>
          {issueModal && (
            <div>
              <InfoRow label="Homeowner" value={issueModal.homeowner} />
              <InfoRow label="Email" value={issueModal.email} />
              <InfoRow label="Phone" value={issueModal.phone} />
              <InfoRow label="Issue Type" value={issueModal.type} />
              <InfoRow label="Service Date" value={issueModal.serviceDate} />
              <InfoRow label="Status" value={issueModal.status} badge />
              <div className="mt-4 p-3.5 bg-muted rounded-lg text-sm text-foreground leading-relaxed">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Message</div>
                {issueModal.message}
              </div>
              <div className="mt-2.5 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-600 font-medium">Related: {issueModal.relatedService}</div>
              <div className="flex gap-2.5 mt-5 justify-end">
                <Button variant="outline" className="gap-1.5" onClick={() => setIssueModal(null)}><Mail className="h-4 w-4" /> Reply via Email</Button>
                {issueModal.status === "Open" && <Button className="gap-1.5" onClick={() => setIssueModal(null)}><Check className="h-4 w-4" /> Mark as Resolved</Button>}
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

      {/* Announcement Modal */}
      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent className="pt-10">
          <DialogHeader>
            <DialogTitle>Create Service Announcement</DialogTitle>
            <DialogDescription>
              This announcement will be sent to all homeowners with services scheduled for today.
            </DialogDescription>
          </DialogHeader>
          {announcementSent ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 font-medium text-center">
              Announcement sent successfully. Homeowners scheduled for today have been notified.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Title</label>
                <Input
                  placeholder="e.g. Service Delay Notice"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Reason / Message</label>
                <Textarea
                  placeholder='e.g. "Due to heavy rain this morning, some pool services scheduled today may arrive later than expected."'
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Affected Services:</span> All services scheduled for today will be included automatically.
              </div>
            </div>
          )}
          <DialogFooter>
            {announcementSent ? (
              <Button variant="outline" onClick={() => setAnnouncementOpen(false)}>Close</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setAnnouncementOpen(false)}>Cancel</Button>
                <Button
                  disabled={!announcementTitle.trim() || !announcementMessage.trim()}
                  onClick={() => {
                    setAnnouncementSent(true);
                    toast({ variant: "default", title: "Announcement sent", description: "Homeowners scheduled for today have been notified." });
                  }}
                >
                  <Megaphone className="h-4 w-4 mr-1.5" /> Send Announcement
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default AdminDashboard;
