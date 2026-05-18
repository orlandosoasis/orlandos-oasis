import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/oo-logo.png";
import MobileNavMenu from "@/components/MobileNavMenu";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Service Area", href: "/service-areas" },
  { label: "Contact", href: "/contact" },
];

const LogoImg = memo(function LogoImg() {
  return <img src={logo} alt="Orlando's Oasis" className="h-8 w-8 object-contain" />;
});

const Header = memo(function Header() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.getElementById(href.slice(1));
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header role="banner" className="sticky top-0 left-0 right-0 z-30 bg-card">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-2 md:py-3 flex items-center justify-between gap-4 md:gap-6">
        {/* Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-1 min-w-0">
          <MobileNavMenu items={NAV_ITEMS} />
          <Link to="/" className="flex items-center gap-2 min-w-0" aria-label="Orlando's Oasis - Home">
            <LogoImg />
            <span className="text-lg md:text-xl font-bold text-foreground truncate">Orlando's Oasis</span>
          </Link>
        </div>

        {/* Desktop Nav Links + Login */}
        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          <nav aria-label="Primary" className="hidden md:flex items-center gap-5">
            {NAV_ITEMS.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors whitespace-nowrap"
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          <Link to="/login">
            <Button size="sm">
              Log In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
});

export default Header;
