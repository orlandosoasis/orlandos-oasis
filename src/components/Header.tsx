import { memo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/oo-logo.png";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#discount-voucher" },
  { label: "Service Area", href: "#service-area" },
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
    <header className="absolute top-0 left-0 right-0 z-30 bg-transparent">
      <div className="container max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <LogoImg />
          <span className="text-xl font-bold text-white drop-shadow-md">Orlando's Oasis</span>
        </Link>

        {/* Nav Links - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) =>
            item.href.startsWith("/") ? (
              <Link
                key={item.label}
                to={item.href}
                className="text-sm font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-sm font-medium text-white/90 hover:text-white transition-colors drop-shadow-sm"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Login Button */}
        <Link to="/login">
          <Button variant="outline" size="sm" className="border-white/40 text-white bg-white/10 hover:bg-white/20 hover:text-white backdrop-blur-sm">
            Log In
          </Button>
        </Link>
      </div>
    </header>
  );
});

export default Header;
