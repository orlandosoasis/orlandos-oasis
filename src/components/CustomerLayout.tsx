import React, { memo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import oasisLogo from "@/assets/oo-logo.png";
import { ArrowLeft, Calendar, LayoutDashboard, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useHomeownerRealtime } from "@/hooks/useHomeownerRealtime";

const BACK_TARGETS: Record<string, string> = {
  "/account-settings": "/dashboard",
  "/account-settings/personal-info": "/account-settings",
  "/account-settings/payment-methods": "/account-settings",
  "/account-settings/cleaning-address": "/account-settings",
  "/account-settings/cleaning-notes": "/account-settings",
  "/account-settings/preferences": "/account-settings",
  "/account-settings/experience-level": "/account-settings",
  "/help": "/service-details",
  "/profile": "/dashboard",
};

const BrandLogo = memo(function BrandLogo() {
  return (
    <>
      <img src={oasisLogo} alt="Orlando's Oasis" className="h-6 w-6 object-contain" />
      <span className="text-[1.25rem] font-bold text-foreground tracking-tight">
        Orlando's Oasis
      </span>
    </>
  );
});

/** Persistent header - never unmounts across customer routes */
const PersistentHeader = memo(function PersistentHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isDashboard = location.pathname === "/dashboard";
  const isSettingsHub = location.pathname === "/account-settings";
  const isSubPage = !isDashboard && !isSettingsHub;

  let backTarget: string | null = null;
  if (isSubPage) {
    backTarget =
      BACK_TARGETS[location.pathname] ||
      (location.pathname.startsWith("/service/") ? "/dashboard" : null) ||
      (location.pathname === "/messages" ? "-1" : null) ||
      (location.pathname.startsWith("/subscription") ? "/dashboard" : null) ||
      "/dashboard";
  }

  const showBackButton = Boolean(isSubPage && backTarget);

  const handleBack = () => {
    if (backTarget === "-1") {
      navigate(-1);
    } else if (backTarget) {
      navigate(backTarget);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="container relative max-w-[760px] mx-auto px-5 h-[60px] flex items-center">
        {isSubPage && (
          <div className="flex min-w-[72px] items-center">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium text-sm">Back</span>
            </button>
          </div>
        )}

        <Link
          to="/dashboard"
          aria-label="Go to dashboard"
          className={isSubPage
            ? "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
            : "flex items-center gap-1.5"
          }
        >
          <BrandLogo />
        </Link>

        <div className="ml-auto flex items-center justify-end gap-3">
          {isDashboard && user && (
            <Button
              size="sm"
              className="font-semibold text-sm rounded-lg px-4 py-2"
              onClick={() => window.dispatchEvent(new CustomEvent("open-booking"))}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Book Service
            </Button>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    <AvatarFallback className="bg-navy text-primary-foreground text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => navigate("/dashboard")}
                  className="cursor-pointer gap-2 focus:bg-muted focus:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/account-settings")}
                  className="cursor-pointer gap-2 focus:bg-muted focus:text-foreground"
                >
                  <Settings className="h-4 w-4" /> Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer gap-2 text-destructive focus:bg-muted focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="h-9 w-9 shrink-0" aria-hidden="true" />
          )}
        </div>
      </div>
    </header>
  );
});

export default function CustomerLayout() {
  const { user } = useAuth();
  useHomeownerRealtime(user?.id);
  return (
    <div className="min-h-screen bg-background">
      <PersistentHeader />
      <Outlet />
    </div>
  );
}
