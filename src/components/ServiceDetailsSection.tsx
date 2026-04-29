import { Check, Clock, MapPin, Shield, Calendar, Sparkles, AlertCircle, Award, CalendarCheck, Tag, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const VALUE_PROPS = [
  {
    icon: Award,
    title: "Trusted Local Experts",
    description: "Experienced technicians who know how to maintain pools in your area.",
  },
  {
    icon: CalendarCheck,
    title: "Reliable Weekly Service",
    description: "Consistent visits that keep your pool clean, balanced, and ready to use.",
  },
  {
    icon: Tag,
    title: "Transparent Pricing",
    description: "No hidden fees. Clear pricing before any service is performed.",
  },
  {
    icon: PlusCircle,
    title: "Flexible Add-ons",
    description: "Upgrade your service anytime with deep cleaning and repair options.",
  },
];

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
    <section className="py-10 md:py-14 lg:py-16 bg-background">
      <div className="container max-w-4xl mx-auto px-4 md:px-6">
        {/* How to Choose the Right Service Pass */}
        <div className="mb-16">
          <h2 className="text-3xl font-extrabold text-navy tracking-tight mb-3 text-center">
            How to Choose the Right Service
          </h2>
          <p className="text-muted-foreground text-center mb-6">
            Use this guide to estimate the right service length for your pool.
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="text-left p-3 border-b font-bold text-card-foreground">Service Frequency</th>
                  <th className="text-left p-3 border-b font-bold text-card-foreground">Best for</th>
                  <th className="text-left p-3 border-b font-bold text-card-foreground">Typical pool condition</th>
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

      {/* Why Orlando's Oasis - value proposition cards */}
      <div className="py-10 md:py-14 lg:py-16 text-gray-300">
        <div className="container max-w-6xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-extrabold text-navy tracking-tight mb-10 text-center">
            Why Orlando's Oasis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {VALUE_PROPS.map(({ title, description }) => (
              <div key={title} className="bg-white border border-border/50 rounded-xl p-6 flex flex-col gap-2">
                <h4 className="font-bold text-card-foreground text-base">{title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceDetailsSection;