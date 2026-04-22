import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import heroImage from "@/assets/hero-pool-resort.png";
import heroVideo from "@/assets/hero-villa.mp4";

const HeroSection = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width: 767px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleGetVoucher = () => {
    const el = document.getElementById("discount-voucher");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[85vh] md:min-h-[92vh] flex flex-col overflow-hidden">
      {/* Background Video / Image Fallback */}
      {isMobile ? (
        <img
          src={heroImage}
          alt="Beautiful residential swimming pool with tropical landscaping"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      ) : (
        <video
          src={heroVideo}
          poster={heroImage}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      )}

      {/* Cinematic dark overlay */}
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

      {/* Centered content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="max-w-xl mx-auto text-center" style={{ textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-8">
            Crystal Clear Pools,
            <br />
            Zero Hassle
          </h1>

          <p className="text-base md:text-lg mb-10 text-white/85 font-light tracking-wide">
            Professional pool maintenance across Tampa,<br />Orlando & Fort Lauderdale.
          </p>

          <div className="flex justify-center">
            <Button
              onClick={handleGetVoucher}
              className="h-12 px-10 text-base font-semibold rounded-full shadow-xl"
            >
              Get a Discount Voucher
            </Button>
          </div>
        </div>
      </div>

      {/* Trust badge anchored at bottom */}
      <div className="relative z-10 pb-8 md:pb-10 px-4">
        <div className="flex items-center gap-2 justify-center" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
          <span className="font-semibold text-white text-sm">Excellent</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-sm text-white/70">
            <span className="font-medium text-white">2,847</span> reviews
          </span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
