import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/oo-logo.png";
import heroVideo1080 from "@/assets/hero-villa-1080p.mp4";
import heroVideo720 from "@/assets/hero-villa-720p.mp4";
import heroVideo480 from "@/assets/hero-villa-480p.mp4";
import heroVideo720Webm from "@/assets/hero-villa-720p.webm";
import heroPoster from "@/assets/hero-villa-poster.jpg";
import MobileNavMenu from "@/components/MobileNavMenu";

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
      {/* Background Video - full bleed, on all viewports */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={heroPoster}
        // @ts-expect-error - fetchpriority is a valid HTML attr not yet in React types
        fetchpriority="high"
        aria-hidden="true"
        onCanPlay={() => setVideoReady(true)}
        onPlaying={() => setVideoReady(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${videoReady ? "opacity-100" : "opacity-0"}`}
      >
        {/* Mobile: smallest file first for fastest start */}
        <source src={heroVideo480} type="video/mp4" media="(max-width: 640px)" />
        {/* Tablet: 720p WebM (VP9) preferred, MP4 fallback */}
        <source src={heroVideo720Webm} type="video/webm" media="(max-width: 1280px)" />
        <source src={heroVideo720} type="video/mp4" media="(max-width: 1280px)" />
        {/* Desktop: 1080p */}
        <source src={heroVideo1080} type="video/mp4" />
      </video>


      {/* Subtle overlay for legibility */}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />

      {/* Full-width header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md shadow-lg hero-nav-enter motion-reduce:animate-none motion-reduce:opacity-100">
        <div className="w-full px-4 md:px-6 lg:px-12 py-2 md:py-3 flex items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-1 min-w-0">
            <MobileNavMenu items={NAV_ITEMS} />
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img src={logo} alt="Orlando's Oasis" className="h-7 w-7 object-contain shrink-0" />
              <span className="text-base md:text-lg font-bold text-foreground truncate">Orlando's Oasis</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-7">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <Link to="/login">
              <Button className="rounded-full h-9 md:h-10 px-4 md:px-5 bg-foreground text-background hover:bg-foreground/90">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Centered headline + supporting copy + CTA */}
      <div className="relative z-10 h-full flex items-center justify-center px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center" style={{ textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}>
          <h1 className="font-extrabold text-white leading-[1.05] md:leading-[0.95] tracking-tight text-4xl sm:text-5xl md:text-7xl lg:text-8xl hero-rise motion-reduce:animate-none motion-reduce:opacity-100" style={{ animationDelay: '100ms' }}>
            <span className="block md:whitespace-nowrap">Crystal Clear Pools.</span>
            <span className="block">Zero Hassle.</span>
          </h1>

          <p
            className="mt-3 md:mt-4 max-w-xl mx-auto text-sm md:text-base text-white/95 leading-relaxed hero-rise motion-reduce:animate-none motion-reduce:opacity-100"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)', animationDelay: '250ms' }}
          >
            Professional pool maintenance across Tampa, Orlando &amp; Fort Lauderdale.
            Weekly service, transparent reports, and pros you can trust.
          </p>

          <div className="mt-5 md:mt-6 flex justify-center hero-rise motion-reduce:animate-none motion-reduce:opacity-100" style={{ animationDelay: '400ms' }}>
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
    </section>
  );
};

export default HeroSection;

