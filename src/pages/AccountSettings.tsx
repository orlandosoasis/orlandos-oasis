import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, User, CreditCard, MapPin, StickyNote, SlidersHorizontal } from "lucide-react";
import PageContainer from "@/components/PageContainer";
import DangerZone from "@/components/account/DangerZone";

const settingsItems = [
  {
    label: "Personal Information",
    description: "Manage your contact details",
    icon: User,
    path: "/account-settings/personal-info",
  },
  {
    label: "Payment & Membership",
    description: "Manage billing and subscription",
    icon: CreditCard,
    path: "/account-settings/payment-methods",
  },
  {
    label: "Cleaning Address",
    description: "Manage your service location",
    icon: MapPin,
    path: "/account-settings/cleaning-address",
  },
  {
    label: "Cleaning Notes",
    description: "Instructions for your technician",
    icon: StickyNote,
    path: "/account-settings/cleaning-notes",
  },
  {
    label: "Preferences",
    description: "Service preferences and household info",
    icon: SlidersHorizontal,
    path: "/account-settings/preferences",
  },
];

const AccountSettings = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageContainer>
        <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

        <div className="bg-card rounded-2xl border border-border shadow-sm divide-y divide-border overflow-hidden">
          {settingsItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
        <DangerZone />

        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          <p className="mt-3">© Orlando's Oasis 2015 - 2026</p>
        </footer>
      </PageContainer>
    </>
  );
};

export default AccountSettings;
