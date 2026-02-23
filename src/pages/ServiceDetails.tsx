import { Link, useNavigate } from "react-router-dom";
import { Waves, ArrowLeft, Clock, Calendar, MapPin, Star, Droplets, Key, ShoppingBag, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/contexts/BookingContext";
import PoolSceneHero from "@/components/dashboard/PoolSceneHero";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM",
};

const ACCESS_LABELS: Record<string, string> = {
  home: "Owner will be home",
  gate: "Gate code provided",
  key: "Key on property",
  other: "Custom instructions provided",
};

const ServiceDetails = () => {
  const navigate = useNavigate();
  const { booking } = useBooking();

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No booking found.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const { selectedPass, scheduleData, technician } = booking;
  const d = scheduleData.selectedDate;
  const formattedDate = `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
  const totalPaid = selectedPass.discountPrice + scheduleData.addonsTotal;

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
            <span className="text-[1.25rem] font-bold text-navy tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-[200px] overflow-hidden">
        <PoolSceneHero />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-[760px] mx-auto">
          <h1 className="text-xl font-bold text-white">{selectedPass.label}</h1>
          <p className="text-sm font-semibold text-white/90">{formattedDate}</p>
          <p className="text-sm text-white/80">Expected arrival {TIME_LABELS[scheduleData.timeWindow]}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[760px] mx-auto px-5 py-6 pb-16">
        {/* Two-column grid: Appointment + Technician */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Appointment Details */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-[17px] font-bold text-foreground mb-4">Appointment Details</h2>
            <div className="flex items-center gap-2 text-sm text-foreground mb-2.5">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{selectedPass.hours} {selectedPass.hours === 1 ? "Hour" : "Hours"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground mb-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground mb-2.5">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span>{selectedPass.description || "Pool Cleaning Service"}</span>
            </div>

            {scheduleData.addons.length > 0 && (
              <>
                <p className="text-[15px] font-bold text-foreground mt-4 mb-2">Add-ons</p>
                <div className="flex flex-wrap gap-1.5">
                  {scheduleData.addons.map((addon) => (
                    <span
                      key={addon.id}
                      className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      {addon.name} · ${addon.price}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Your Technician */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Your Technician</p>
            <div className="flex gap-3.5 items-start">
              <div className="w-[72px] h-[72px] rounded-xl bg-gradient-to-br from-primary to-oasis-aqua flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0">
                {technician.isAssigned ? technician.initials : "?"}
              </div>
              <div>
                <p className="text-base font-bold text-foreground">
                  {technician.isAssigned ? technician.name : "To be assigned"}
                </p>
                {technician.isAssigned && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <Star className="h-3.5 w-3.5 fill-cta-yellow text-cta-yellow" />
                    <span>{technician.rating}</span>
                  </div>
                )}
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Your assigned pool care specialist for this service visit.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Pool */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm mb-4">
          <h2 className="text-[17px] font-bold text-foreground mb-4">Your Pool</h2>
          <div className="flex items-center gap-2 text-sm text-foreground mb-2.5">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>123 Main Street, Miami, FL 33101</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground mb-2.5">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span>{ACCESS_LABELS[scheduleData.accessMethod]}</span>
          </div>
          {scheduleData.accessDetail && (
            <>
              <p className="text-[15px] font-bold text-foreground mt-4 mb-1.5">Access Notes</p>
              <p className="text-[13.5px] text-muted-foreground leading-relaxed">{scheduleData.accessDetail}</p>
            </>
          )}
        </div>

        {/* Payment + Help grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Details */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-[17px] font-bold text-foreground mb-3">Payment Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base service</span>
                <span className="text-foreground font-medium">${selectedPass.discountPrice.toFixed(2)}</span>
              </div>
              {scheduleData.addons.map((addon) => (
                <div key={addon.id} className="flex justify-between">
                  <span className="text-muted-foreground">{addon.name}</span>
                  <span className="text-foreground font-medium">${addon.price.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-bold text-foreground">Total Paid</span>
                <span className="font-bold text-foreground">${totalPaid.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Need help */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="text-[17px] font-bold text-foreground mb-3">Need more help?</h2>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed">
              View our <a href="#" className="text-primary font-semibold hover:underline">help center</a> for more information on what to expect and how Orlando's Oasis works, or <a href="#" className="text-primary font-semibold hover:underline">report an issue</a>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <a href="#" className="text-primary hover:underline">Terms</a>
          <a href="#" className="text-primary hover:underline">Privacy</a>
          <a href="#" className="text-primary hover:underline">Do Not Sell My Personal Information</a>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>
    </div>
  );
};

export default ServiceDetails;
