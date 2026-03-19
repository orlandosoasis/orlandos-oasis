import { memo } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/oo-logo.png";

const LogoImg = memo(function LogoImg() {
  return <img src={logo} alt="Orlando's Oasis" className="h-8 w-8 object-contain" />;
});

const Header = memo(function Header() {
  return (
    <header className="bg-card py-4 px-4 md:px-8">
      <div className="container max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <LogoImg />
          <span className="text-xl font-bold text-navy">Orlando's Oasis</span>
        </Link>
      </div>
    </header>
  );
});

export default Header;
