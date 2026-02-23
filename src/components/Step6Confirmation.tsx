import { useState } from "react";
import { Check, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PassOption {
  id: string;
  hours: number;
  label: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  percentOff: number;
  isMostPopular: boolean;
}

interface AddonItem {
  id: string;
  name: string;
  price: number;
}

interface ScheduleData {
  selectedDate: Date;
  timeWindow: "morning" | "afternoon" | "evening";
  accessMethod: "home" | "gate" | "key" | "other";
  accessDetail: string;
  addons: AddonItem[];
  addonsTotal: number;
}

interface Step6Props {
  selectedPass: PassOption;
  scheduleData: ScheduleData;
}

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

const Step6Confirmation = ({ selectedPass, scheduleData }: Step6Props) => {
  const [toastVisible, setToastVisible] = useState(false);

  const d = scheduleData.selectedDate;
  const formattedDate = `${FULL_DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  const totalCharged = selectedPass.discountPrice + scheduleData.addonsTotal;

  const handleDashboardClick = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg animate-scale-in">
          <Check className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <h1 className="text-[28px] sm:text-[36px] font-bold text-foreground leading-tight tracking-tight mb-3">
          Your First Cleaning<br />Is Scheduled
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-[520px] mx-auto leading-relaxed">
          {formattedDate.split(",")[0]}, {MONTHS[d.getMonth()]} {d.getDate()}th is locked in.
          You can manage everything — timing, access, add-ons — from your dashboard.
        </p>
      </div>

      {/* Booking Card */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col">
          {/* Service Date */}
          <div className="flex items-start justify-between py-4 border-b border-border gap-4">
            <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-muted-foreground pt-0.5 whitespace-nowrap">
              Service Date
            </span>
            <span className="text-[15px] font-medium text-foreground text-right leading-snug">
              {formattedDate}
            </span>
          </div>

          {/* Arrival Window */}
          <div className="flex items-start justify-between py-4 border-b border-border gap-4">
            <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-muted-foreground pt-0.5 whitespace-nowrap">
              Arrival Window
            </span>
            <span className="text-[15px] font-medium text-foreground text-right">
              {TIME_LABELS[scheduleData.timeWindow]}
            </span>
          </div>

          {/* Pool Access */}
          <div className="flex items-start justify-between py-4 border-b border-border gap-4">
            <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-muted-foreground pt-0.5 whitespace-nowrap">
              Pool Access
            </span>
            <span className="text-[15px] font-normal text-muted-foreground text-right">
              {ACCESS_LABELS[scheduleData.accessMethod]}
              {scheduleData.accessDetail && ` · ${scheduleData.accessDetail}`}
            </span>
          </div>

          {/* Service */}
          <div className="flex items-start justify-between py-4 border-b border-border gap-4">
            <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-muted-foreground pt-0.5 whitespace-nowrap">
              Service
            </span>
            <span className="text-[15px] font-medium text-foreground text-right">
              {selectedPass.label}
            </span>
          </div>

          {/* Add-ons */}
          {scheduleData.addons.length > 0 && (
            <div className="flex items-start justify-between py-4 gap-4">
              <span className="text-[13px] font-medium uppercase tracking-[0.06em] text-muted-foreground pt-0.5 whitespace-nowrap">
                Add-ons
              </span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {scheduleData.addons.map((addon) => (
                  <span
                    key={addon.id}
                    className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                  >
                    {addon.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Payment Strip */}
        <div className="bg-muted/50 border-t border-border px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[13px] text-muted-foreground">Total charged</p>
            <p className="text-[28px] font-bold text-foreground tracking-tight">${totalCharged}</p>
          </div>
          <button className="text-[13px] font-medium text-primary hover:underline whitespace-nowrap">
            View payment breakdown →
          </button>
        </div>
      </div>

      {/* CTA */}
      <div>
        <Button
          onClick={handleDashboardClick}
          className="w-full h-14 text-[17px] font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all gap-2"
        >
          Access My Dashboard
          <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2} />
        </Button>
        <p className="text-center text-[13px] text-muted-foreground mt-2.5">
          We'll send a secure access link to your email.
        </p>
      </div>

      {/* Toast */}
      <div
        className={`fixed top-5 right-5 bg-card rounded-xl shadow-xl border border-border p-3.5 flex items-center gap-2.5 max-w-[320px] z-[9999] transition-all duration-300 ${
          toastVisible
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-[calc(100%+24px)] pointer-events-none"
        }`}
      >
        <div className="w-8 h-8 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center">
          <Mail className="h-4 w-4 text-primary" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground leading-snug">Secure access link sent.</p>
          <p className="text-xs text-muted-foreground mt-0.5">Check your inbox to enter your dashboard.</p>
        </div>
      </div>
    </div>
  );
};

export default Step6Confirmation;
