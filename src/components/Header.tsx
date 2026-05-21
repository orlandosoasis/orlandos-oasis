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

interface HeaderProps {
  minimal?: boolean;
}

const Header = memo(function Header({ minimal = false }: HeaderProps) {
  return (
    <header
      role="banner"
      className="sticky top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md shadow-lg"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="w-full px-4 md:px-6 lg:px-12 py-2 md:py-3 flex items-center justify-between gap-3 md:gap-6">
        <div className="flex items-center gap-1 min-w-0">
          {!minimal && <MobileNavMenu items={NAV_ITEMS} />}
          <Link to="/" className="flex items-center gap-2 min-w-0" aria-label="Orlando's Oasis - Home">
            <img src={logo} alt="Orlando's Oasis" className="h-7 w-7 object-contain shrink-0" />
            <span className="text-base md:text-lg font-bold text-foreground truncate">Orlando's Oasis</span>
          </Link>
        </div>

        {!minimal && (
          <nav aria-label="Primary" className="hidden md:flex items-center gap-7">
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
        )}

        <div className="flex items-center gap-1 shrink-0">
          <Link to="/login">
            <Button className="rounded-full h-9 md:h-10 px-4 md:px-5 bg-foreground text-background hover:bg-foreground/90">
              Log In
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
});

export default Header;
