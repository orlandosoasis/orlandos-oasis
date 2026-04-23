import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/oo-logo.png";
import heroImage from "@/assets/hero-pool-resort.png";
import heroVideo from "@/assets/hero-villa.mp4";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Service Area", href: "/service-areas" },
  { label: "Contact", href: "/contact" },
];

const HeroSection = () => {
  const [videoReady, setVideoReady] = useState(false);

  const handleGetVoucher = () => {
    const el = document.getElementById("discount-voucher");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full h-screen min-h-[640px] overflow-hidden bg-background">
      {/* Background Video — full bleed, on all viewports */}
      <video
        src={heroVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        onCanPlay={() => setVideoReady(true)}
        onPlaying={() => setVideoReady(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${videoReady ? "opacity-100" : "opacity-0"}`}
      />


      {/* Subtle overlay for legibility */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />

      {/* Floating pill header */}
      <div className="fixed top-4 md:top-6 left-0 right-0 z-50 px-3 sm:px-4 md:px-6">
        <div className="max-w-[1280px] mx-auto bg-card/95 backdrop-blur-md rounded-full shadow-lg flex items-center justify-between pl-5 pr-2 py-2">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="Orlando's Oasis" className="h-7 w-7 object-contain" />
            <span className="text-base md:text-lg font-bold text-foreground">Orlando's Oasis</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link to="/login" className="shrink-0">
            <Button className="rounded-full h-10 px-5 bg-foreground text-background hover:bg-foreground/90">
              Log In
            </Button>
          </Link>
        </div>
      </div>

      {/* Centered headline with strikethrough accent */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}>
          <h1 className="font-extrabold text-white leading-[0.95] tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
            <span>Crystal Clear Pools.</span>
            <br />
            <span>Zero Hassle.</span>
          </h1>

          <div className="mt-10 flex justify-center">
            <Button
              onClick={handleGetVoucher}
              className="h-12 px-8 rounded-full text-base font-semibold shadow-xl"
              style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            >
              Get a Discount Voucher
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom-left supporting copy */}
      <div className="absolute left-0 right-0 bottom-8 md:bottom-12 z-10 px-6 md:px-12">
        <p
          className="max-w-md text-sm md:text-base text-white/95 leading-relaxed"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
        >
          Professional pool maintenance across Tampa, Orlando &amp; Fort Lauderdale.
          Weekly service, transparent reports, and pros you can trust.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
