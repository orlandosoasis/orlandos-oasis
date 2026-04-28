import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/oo-logo.png";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Service Area", href: "/service-areas" },
  { label: "Contact", href: "/contact" },
];

/**
 * Fixed, floating pill-shaped navigation that overlays the viewport.
 * Matches the look used inside the homepage hero, but available as a
 * standalone component for sub-pages that don't have a full-bleed hero.
 */
const FloatingNav = () => (
  <div className="fixed top-4 md:top-6 left-0 right-0 z-50 px-3 sm:px-4 md:px-6">
    <div className="max-w-[1280px] mx-auto bg-card/95 backdrop-blur-md rounded-full shadow-lg flex flex-col items-center justify-center gap-4 p-6 md:py-3 md:px-10">
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
);

export default FloatingNav;
