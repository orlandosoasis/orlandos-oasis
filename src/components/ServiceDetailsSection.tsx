import { Check, Clock, MapPin, Shield, Calendar, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SERVICE_GUIDE = [
  { duration: "Weekly Service", bestFor: "Regular maintenance", poolType: "Most residential pools with normal use" },
  { duration: "Twice per Week", bestFor: "Extra care + stability", poolType: "Pools with higher usage or recurring issues" },
  { duration: "Three Times per Week", bestFor: "Maximum cleanliness + clarity", poolType: "High-demand pools or those needing premium care" },
];

const EVERY_VISIT_ITEMS = [
  "Skimming surface debris",
  "Brushing walls, steps, and tile line",
  "Vacuuming pool as needed",
  "Emptying skimmer and pump baskets",
  "Water chemistry testing and balancing",
  "Adding necessary chemicals",
  "Filter system check",
  "Equipment inspection",
  "Water level monitoring",
];

const MEMBER_BENEFITS = [
  "Member pricing on additional visits",
  "Priority scheduling",
  "Discounted add-ons",
];

const PREMIUM_ADDONS = [
  "Weekly Pool/Spa Cleaning",
  "Chemical Testing & Balancing",
  "Filter Cleaning / Salt Cell Cleaning & Backwashing",
  "Pool Equipment Inspection",
  "Pool Equipment Repair",
  "Green-to-Clean / Algae Treatment",
  "Tile & Surface Cleaning",
  "Acid Washing",
  "Pool Inspections",
  "Pool Startups",
];

const SERVICE_AREAS = [
  { city: "Tampa", state: "FL" },
  { city: "Orlando", state: "FL" },
  { city: "Fort Lauderdale", state: "FL" },
];

const WHY_CHOOSE_US = [
  "Consistent weekly service",
  "Easy online scheduling",
  "Clear pricing and predictable visits",
  "Appointments available 7 days a week",
  "Member savings on ongoing care",
];

const WHAT_WE_DONT_DO = [
  "Major equipment repair (pump/heater replacement)",
  "Structural resurfacing",
  "Leak detection",
  "Electrical work",
];

const FINE_PRINT = [
  "Offer valid for new customers.",
  "Online booking required.",
  "Reschedule/cancel policy: 6-hour notice.",
  "Service Pass expires after 12 months if unused.",
  "Executive Plan discounts apply while membership is active.",
  "Cancel any time. If cancelled before 6 paid months, the initial discounted month may be adjusted to standard pricing.",
];

const ServiceDetailsSection = () => {
  const scrollToVoucher = () => {
    const voucherSection = document.getElementById("discount-voucher");
    if (voucherSection) {
      voucherSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 bg-background">
      <div className="container max-w-4xl mx-auto px-4">
        {/* How to Choose the Right Service Pass */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-navy mb-3 text-center">
            How to Choose the Right Service Pass
          </h3>
          <p className="text-muted-foreground text-center mb-6">
            Use this guide to estimate the right service length for your pool.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 text-navy border-b font-bold">Service Frequency</th>
                  <th className="text-left p-3 text-navy border-b font-bold">Best for</th>
                  <th className="text-left p-3 text-navy border-b font-bold">Typical pool condition</th>
                </tr>
              </thead>
              <tbody>
                {SERVICE_GUIDE.map((row, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-normal text-muted-foreground">{row.duration}</td>
                    <td className="p-3 text-muted-foreground">{row.bestFor}</td>
                    <td className="p-3 text-muted-foreground">{row.poolType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-navy">Extra time:</span> If your pool needs extra time during the first visit, we'll confirm it before continuing. Additional time is billed at a discounted rate for Executive Plan members.
            </p>
          </div>
        </div>
      </div>

      {/* Why Orlando's Oasis - own full-width section */}
      <div className="py-16">
        <div className="container max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-navy mb-6 text-center">
            Why Orlando's Oasis
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {WHY_CHOOSE_US.map((item, index) => (
              <div key={index} className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
                <Check className="h-4 w-4 text-oasis" />
                <span className="text-sm font-medium text-navy">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's Included - own full-width section */}
      <div className="bg-muted/40 mt-8 py-16">
        <div className="container max-w-4xl mx-auto px-4">
          <h3 className="text-2xl font-bold text-navy mb-8 text-center">
            What's Included
          </h3>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Every Visit */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-navy">Every Visit</h4>
              </div>
              <ul className="space-y-2">
                {EVERY_VISIT_ITEMS.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-oasis shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium Add-ons */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-navy">Premium Add-ons</h4>
              </div>
              <ul className="space-y-2">
                {PREMIUM_ADDONS.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-oasis shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceDetailsSection;