import { Link, useNavigate } from "react-router-dom";
import { Waves, ArrowLeft, RefreshCw, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/contexts/BookingContext";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Subscription = () => {
  const navigate = useNavigate();
  const { booking } = useBooking();

  const isMonthly = booking?.frequency === "monthly";
  const d = booking?.scheduleData?.selectedDate || new Date();

  const getNextServiceDate = () => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return `${FULL_DAYS[next.getDay()]}, ${SHORT_MONTHS[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-1.5">
            <Waves className="h-5 w-5 text-primary" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16 space-y-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Subscription</h1>

        {/* Recurring Schedule */}
        {isMonthly && (
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-[17px] font-bold text-foreground mb-4">Recurring Schedule</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequency</span>
                <span className="font-medium text-foreground">Monthly</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next service date</span>
                <span className="font-medium text-foreground">{getNextServiceDate()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auto-renew</span>
                <span className="font-medium text-foreground">Yes</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4 hover:bg-primary hover:text-primary-foreground hover:border-primary" onClick={() => navigate("/dashboard")}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Manage Plan
            </Button>
          </div>
        )}

        {!isMonthly && (
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active subscription found.</p>
            <Button className="mt-4" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <Link to="/terms" className="text-primary hover:underline">Terms</Link>
          <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>
    </div>
  );
};

export default Subscription;
