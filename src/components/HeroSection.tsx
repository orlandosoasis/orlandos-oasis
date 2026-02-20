import { Star, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-cleaners.jpg";

const SERVICE_AREAS = [
  { city: "Tampa", state: "FL" },
  { city: "Orlando", state: "FL" },
  { city: "Fort Lauderdale", state: "FL" },
];

const HeroSection = () => {
  const handleGetVoucher = () => {
    const voucherSection = document.getElementById("discount-voucher");
    if (voucherSection) {
      voucherSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative bg-card">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="relative min-h-[500px] md:min-h-[550px] rounded-xl overflow-hidden">
          {/* Background Image */}
          <img
            src={heroImage}
            alt="Professional pool technician at work"
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {/* Overlay for mobile readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/40 via-transparent to-transparent md:hidden" />
          
          {/* Form Card */}
          <div className="relative flex items-center justify-end h-full min-h-[500px] md:min-h-[550px] p-4 md:p-8">
            <div className="w-full md:w-[420px] bg-card rounded-xl shadow-2xl p-6 md:p-8 animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-navy leading-tight mb-3">
                Crystal-clear pools, zero hassle. Now serving Florida
              </h1>
              
              <p className="text-muted-foreground mb-4">
                Serving Tampa, Orlando, and Fort Lauderdale.
                <span className="block text-sm mt-1">Expanding across Florida next.</span>
              </p>

              {/* Service Area Chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {SERVICE_AREAS.map((area) => (
                  <span
                    key={area.city}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    <MapPin className="h-3 w-3" />
                    {area.city}, {area.state}
                  </span>
                ))}
                <span className="inline-flex items-center px-3 py-1.5 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                  + Expanding
                </span>
              </div>

              {/* Offer Line */}
              <div className="bg-oasis/10 border border-oasis/30 rounded-lg p-3 mb-5">
                <p className="text-sm font-semibold text-navy">
                  🎉 Get up to <span className="text-oasis">85% off</span> on your first month when you sign up today to our Executive Plan.
                </p>
              </div>
              
              <Button 
                onClick={handleGetVoucher}
                className="w-full h-12 text-base font-semibold mb-4"
              >
                Get a Discount Voucher
              </Button>

              <p className="text-xs text-muted-foreground text-center mb-5">
                Not in these areas yet? <button className="underline hover:text-primary">Join the waitlist</button>
              </p>
              
              {/* Trust Badge */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="font-semibold text-navy">Excellent</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-oasis text-oasis" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium text-navy">2,847</span> reviews
                </span>
              </div>

              {/* Login CTA */}
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Already a member?
                </p>
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full h-11 font-semibold">
                    Log In to Your Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
