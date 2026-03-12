import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Calendar } from "lucide-react";
import oasisLogo from "@/assets/oasis-logo-circle.png";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";
import ManageMembershipModal from "@/components/ManageMembershipModal";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Subscription = () => {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const { toast } = useToast();
  const [manageOpen, setManageOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const isMonthly = booking?.frequency === "monthly";
  const d = booking?.scheduleData?.selectedDate || new Date();

  const planName = booking?.selectedPass?.label || booking?.selectedPlan?.label || "Pool Care Membership";

  const getNextDate = () => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return `${FULL_DAYS[next.getDay()]}, ${SHORT_MONTHS[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`;
  };

  const nextDateStr = getNextDate();

  const handleCancelled = () => {
    setCancelled(true);
    toast({
      title: "Membership cancelled successfully",
      description: "Your recurring service will no longer renew.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-1.5">
            <img src={oasisLogo} alt="Orlando's Oasis" className="h-6 w-6 object-contain" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16 space-y-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Subscription</h1>

        {isMonthly ? (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Membership Status */}
            <div className="p-6 space-y-3">
              <h2 className="text-[17px] font-bold text-foreground">Membership Status</h2>

              {cancelled && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm">
                  <p className="font-medium text-destructive">Your membership has been cancelled.</p>
                  <p className="text-destructive/80 mt-1">No future recurring services will be scheduled.</p>
                </div>
              )}

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium text-foreground">{planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${cancelled ? "text-destructive" : "text-primary"}`}>
                    {cancelled ? "Cancelled" : "Active"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Cycle</span>
                  <span className="font-medium text-foreground">Monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Billing Date</span>
                  <span className="font-medium text-foreground">{cancelled ? "—" : nextDateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto-renew</span>
                  <span className="font-medium text-foreground">{cancelled ? "No" : "Yes"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Recurring Schedule */}
            <div className="p-6 space-y-3">
              <h2 className="text-[17px] font-bold text-foreground">Recurring Schedule</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-medium text-foreground">Monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Service Date</span>
                  <span className="font-medium text-foreground">
                    {cancelled ? "None scheduled" : nextDateStr}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Auto-renew</span>
                  <span className="font-medium text-foreground">{cancelled ? "No" : "Yes"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Manage Plan CTA */}
            <div className="p-6">
              <Button
                className="w-full"
                disabled={cancelled}
                onClick={() => setManageOpen(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {cancelled ? "Membership Cancelled" : "Manage Plan"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active subscription found.</p>
            <Button className="mt-4" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>

      <ManageMembershipModal
        open={manageOpen}
        onOpenChange={setManageOpen}
        nextServiceDate={nextDateStr}
        onCancelled={handleCancelled}
      />
    </div>
  );
};

export default Subscription;
