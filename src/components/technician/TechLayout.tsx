import { Link, useLocation, useNavigate } from "react-router-dom";
import oasisLogo from "@/assets/oo-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Briefcase,
  Droplets,
  CalendarDays,
  MessagesSquare,
  CheckCircle2,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Jobs", path: "/tech/jobs", icon: Briefcase },
  { label: "Pools", path: "/tech/pools", icon: Droplets },
  { label: "Schedule", path: "/tech/schedule", icon: CalendarDays },
  { label: "Messages", path: "/tech/messages", icon: MessagesSquare },
  { label: "Completed", path: "/tech/completed", icon: CheckCircle2 },
];

interface TechLayoutProps {
  children: ReactNode;
  title?: string;
  unreadMessages?: number;
}

export default function TechLayout({ children, title, unreadMessages = 3 }: TechLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "T";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-muted transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link to="/tech-dashboard" className="flex items-center gap-1.5">
              <img src={oasisLogo} alt="Orlando's Oasis" className="h-6 w-6 object-contain" />
              <span className="text-[1.25rem] font-bold text-foreground tracking-tight">
                Orlando's Oasis
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-navy text-white text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer hover:bg-muted focus:bg-muted"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive hover:bg-muted focus:bg-muted hover:text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-[220px] bg-card border-r border-border flex-col shrink-0 sticky top-[60px] h-[calc(100vh-60px)]">
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const hasUnread = item.label === "Messages" && unreadMessages > 0;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                  {hasUnread && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-destructive" />
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-border">
            <p className="text-xs text-muted-foreground truncate">
              {user?.fullName || "Technician"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </aside>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setMobileMenuOpen(false)}>
            <aside className="w-[260px] bg-card h-full border-r border-border pt-[60px] animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <nav className="px-3 py-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const hasUnread = item.label === "Messages" && unreadMessages > 0;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative",
                        active
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {item.label}
                      {hasUnread && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-destructive" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-[860px] mx-auto px-5 py-8 pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
