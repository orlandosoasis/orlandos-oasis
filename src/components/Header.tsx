import { memo } from "react";
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
    <header className="sticky top-0 left-0 right-0 z-30 bg-card">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <LogoImg />
          <span className="text-xl font-bold text-foreground">Orlando's Oasis</span>
        </Link>

        {/* Nav Links + Login */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-5">
            {NAV_ITEMS.map((item) =>
              item.href.startsWith("/") ? (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
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
