import { Check, Clock, MapPin, Shield, Calendar, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SERVICE_GUIDE = [
  { duration: "30 min", bestFor: "Chemical check + quick skim", poolType: "Low-debris / already maintained" },
  { duration: "60 min", bestFor: "Standard weekly service", poolType: "Most residential pools" },
  { duration: "90 min", bestFor: "Deep clean + extra vacuum", poolType: "First-time service or heavy debris" },
  { duration: "120 min", bestFor: "Recovery + reset", poolType: "Neglected, green, or storm aftermath" },
];

const EVERY_VISIT_ITEMS = [
  "Skim surface debris",
  "Empty skimmer and pump baskets",
  "Brush walls, steps, and tile line",
  "Vacuum as needed (time-dependent)",
  "Test and balance water chemistry (chlorine, pH, alkalinity)",
  "Quick equipment check (visual inspection)",
];

const MEMBER_BENEFITS = [
  "Member pricing on additional visits",
  "Priority scheduling",
  "Discounted add-ons",
];

const PREMIUM_ADDONS = [
  "Filter clean/backwash",
  "Salt cell inspection/clean",
  "Algae treatment",
  "Shock treatment",
  "Tile line scrub",
  "Green-to-clean recovery",
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
        {/* Quality + Convenience Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
            Quality + Convenience
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Keep your pool crystal clear with Orlando's Oasis. Choose a discounted Service Pass for your first month, schedule online, and manage everything in one place.
          </p>
          <div className="bg-oasis/10 border border-oasis/30 rounded-lg p-4 max-w-xl mx-auto">
            <p className="font-semibold text-navy">
              🎉 Get up to <span className="text-oasis">85% off</span> on your first month when you sign up today to our Executive Plan.
            </p>
          </div>
        </div>

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
                  <th className="text-left p-3 font-semibold text-navy border-b">Service Length</th>
                  <th className="text-left p-3 font-semibold text-navy border-b">Best for</th>
                  <th className="text-left p-3 font-semibold text-navy border-b">Typical pool type</th>
                </tr>
              </thead>
              <tbody>
                {SERVICE_GUIDE.map((row, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium text-navy">{row.duration}</td>
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


        {/* What's Included */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-navy mb-8 text-center">
            What's Included
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
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

            {/* Executive Plan Member Benefits */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-navy">Executive Plan Benefits</h4>
              </div>
              <ul className="space-y-2">
                {MEMBER_BENEFITS.map((item, index) => (
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

        {/* Service Areas */}
        <div className="mb-16 text-center">
          <h3 className="text-2xl font-bold text-navy mb-4">
            Service Areas
          </h3>
          <p className="text-muted-foreground mb-6">Currently serving:</p>
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {SERVICE_AREAS.map((area) => (
              <span
                key={area.city}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full font-medium"
              >
                <MapPin className="h-4 w-4" />
                {area.city}, {area.state}
              </span>
            ))}
          </div>
          <p className="text-muted-foreground mb-4">Expanding across Florida next.</p>
          <button className="text-sm text-primary underline hover:text-primary/80 transition-colors">
            Want us in your city? Join the waitlist.
          </button>
        </div>

        {/* CTA */}
        <div className="text-center mb-16">
          <Button onClick={scrollToVoucher} size="lg" className="h-14 px-8 text-lg font-semibold">
            Get a Discount Voucher
          </Button>
        </div>

        {/* About Orlando's Oasis */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-navy mb-4 text-center">
            About Orlando's Oasis
          </h3>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
            Orlando's Oasis provides reliable pool care built for consistency. We focus on clear communication, predictable service, and water that stays balanced week to week.
          </p>
          
          <div className="bg-muted/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-semibold text-navy">What we don't do</h4>
            </div>
            <ul className="grid md:grid-cols-2 gap-2">
              {WHAT_WE_DONT_DO.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3 italic">
              (These can be routed to partner referrals.)
            </p>
          </div>
        </div>

        {/* Why Orlando's Oasis */}
        <div className="mb-16">
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

        {/* The Fine Print */}
        <div className="border-t border-border pt-8">
          <h4 className="text-lg font-semibold text-navy mb-4 text-center">
            The Fine Print
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground max-w-2xl mx-auto">
            {FINE_PRINT.map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default ServiceDetailsSection;