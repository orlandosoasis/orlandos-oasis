import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-pool-resort.png";

const HeroSection = () => {
  const handleGetVoucher = () => {
    const el = document.getElementById("discount-voucher");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[600px] md:min-h-[650px] flex items-center">
      {/* Background Image */}
      <img
        src={heroImage}
        alt="Beautiful residential swimming pool with tropical landscaping"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy/60 via-navy/40 to-navy/30" />

      {/* Content */}
      <div className="relative z-10 container max-w-6xl mx-auto px-4 md:px-8 pt-20 pb-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
            Crystal Clear Pools,
            <br />
            Zero Hassle
          </h1>

          <p className="text-base md:text-lg text-white/85 mb-3 drop-shadow-sm">
            Professional pool maintenance across Tampa, Orlando &amp; Fort Lauderdale.
          </p>


          <div className="flex justify-center">
            <Button
              onClick={handleGetVoucher}
              className="h-12 px-8 text-base font-semibold shadow-lg"
            >
              Get a Discount Voucher
            </Button>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center gap-2 justify-center mt-6">
            <span className="font-semibold text-white drop-shadow-sm">Excellent</span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-oasis text-oasis" />
              ))}
            </div>
            <span className="text-sm text-white/70">
              <span className="font-medium text-white">2,847</span> reviews
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
