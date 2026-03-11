import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Waves } from "lucide-react";

const Terms = () => {
  const navigate = useNavigate();
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <Link to="/service-details" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5">
            <Waves className="h-5 w-5 text-primary" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16">
        <h1 className="text-2xl font-bold text-foreground mb-6">Terms of Service</h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">1. Overview</h2>
            <p>Orlando's Oasis provides residential pool cleaning and maintenance services through scheduled appointments. By booking a service, you agree to these terms and conditions.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">2. Services</h2>
            <p>We offer one-time and recurring pool cleaning services, including skimming, brushing, vacuuming, chemical balancing, and filter maintenance. The scope of work depends on the service tier selected at the time of booking. Services are limited to residential pools within our coverage area.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">3. Booking & Payments</h2>
            <p className="mb-2">By completing a booking, you authorize Orlando's Oasis to charge the payment method on file for the agreed service amount.</p>
            <p className="mb-2">For monthly services, your subscription will automatically renew each billing cycle at the current rate unless canceled prior to the next service date.</p>
            <p>Cancellations and rescheduling requests must be submitted at least 24 hours before the scheduled appointment. Late cancellations may be subject to a service fee.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">4. Access Requirements</h2>
            <p>Homeowners are responsible for providing safe and clear access to the pool area on the day of service. This includes securing pets, removing obstructions, and ensuring the gate or entry method is accessible as described during booking.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">5. Satisfaction & Liability</h2>
            <p>Orlando's Oasis strives to deliver high-quality service on every visit. If you are not satisfied, please contact us within 48 hours of service completion. Our liability is limited to the cost of the service performed and does not cover pre-existing damage, equipment malfunctions, or conditions beyond our control.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-foreground mb-2">6. Modifications</h2>
            <p>Orlando's Oasis reserves the right to update services, pricing, or these terms at any time. Customers will be notified of material changes via email or through the app before they take effect.</p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground mt-10">Last updated: March 2026</p>
      </main>
    </div>
  );
};

export default Terms;
