import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, ShieldCheck, Sparkles } from "lucide-react";
import logo from "@/assets/oo-logo.png";
import heroImage from "@/assets/pool-cleaning-hero.jpg";
import MobileNavMenu from "@/components/MobileNavMenu";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Service Area", href: "/service-areas" },
  { label: "Contact", href: "/contact" },
];

const HeroSection = () => {
  const handleGetVoucher = () => {
    const el = document.getElementById("discount-voucher");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative w-full bg-background overflow-hidden">
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md shadow-lg">
        <div className="w-full px-4 md:px-6 lg:px-12 py-2 md:py-3 flex items-center justify-between gap-3 md:gap-6">
          <div className="flex items-center gap-1 min-w-0">
            <MobileNavMenu items={NAV_ITEMS} />
            <Link to="/" className="flex items-center gap-2 min-w-0">
              <img src={logo} alt="Orlando's Oasis" className="h-7 w-7 object-contain shrink-0" />
              <span className="text-base md:text-lg font-bold text-foreground truncate">
                Orlando's Oasis
              </span>
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

      {/* Split hero */}
      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-28 md:pt-36 pb-12 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Left: copy */}
          <div className="order-2 lg:order-1">
            {/* Trust pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 mb-6">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="text-xs font-semibold text-foreground">
                5,000+ Happy Pool Owners
              </span>
            </div>

            <h1 className="font-extrabold text-foreground leading-[1.05] tracking-tight text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="block">Crystal Clear Pools.</span>
              <span className="block text-primary">Zero Hassle.</span>
            </h1>

            <p className="mt-5 md:mt-6 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
              Professional pool maintenance across Tampa, Orlando &amp; Fort Lauderdale.
              Weekly service, transparent reports, and pros you can trust.
            </p>

            {/* CTAs */}
            <div className="mt-7 md:mt-8 flex flex-wrap items-center gap-3">
              <Button
                onClick={handleGetVoucher}
                className="h-12 px-7 rounded-full text-base font-semibold shadow-xl"
              >
                Get a Discount Voucher
              </Button>
              <Link to="/services">
                <Button
                  variant="outline"
                  className="h-12 px-7 rounded-full text-base font-semibold"
                >
                  View Services
                </Button>
              </Link>
            </div>

            {/* Stats / trust */}
            <div className="mt-9 md:mt-10 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg border-t border-border pt-6">
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-foreground leading-none">
                  5,000+
                </p>
                <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">
                  Pools Serviced
                </p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-foreground leading-none flex items-center gap-1">
                  4.9
                  <Star className="h-4 w-4 md:h-5 md:w-5 fill-primary text-primary" />
                </p>
                <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">
                  Average Rating
                </p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-foreground leading-none">
                  100%
                </p>
                <p className="mt-1.5 text-xs md:text-sm text-muted-foreground">
                  Insured Techs
                </p>
              </div>
            </div>
          </div>

          {/* Right: image */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
              <img
                src={heroImage}
                alt="Pool technician servicing a residential swimming pool"
                className="w-full h-full object-cover"
                loading="eager"
                // @ts-expect-error - fetchpriority valid HTML attr
                fetchpriority="high"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent pointer-events-none" />

              {/* Floating trust badge */}
              <div className="absolute bottom-5 left-5 right-5 sm:right-auto bg-card/95 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl border border-border">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-card-foreground truncate">
                    Background-checked techs
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Verified, insured &amp; trained
                  </p>
                </div>
              </div>
            </div>

            {/* Decorative accent */}
            <div className="hidden lg:block absolute -top-4 -right-4 w-24 h-24 rounded-full bg-primary/10 -z-10" />
            <div className="hidden lg:flex absolute -bottom-4 -left-4 w-16 h-16 rounded-2xl bg-secondary items-center justify-center shadow-md">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
