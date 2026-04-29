import { Link } from "react-router-dom";
import logo from "@/assets/oo-logo.png";

const Footer = () => {
  return (
    <footer className="py-10 md:py-8" style={{ background: 'hsl(210 60% 12%)' }}>
      <div className="container max-w-6xl mx-auto px-4 md:px-6">
        {/* Mobile: stacked centered. Tablet+: 2-column with links right. Desktop (lg): 3-segment row. */}
        <div className="flex flex-col items-center text-center gap-4 md:flex-row md:items-center md:justify-between md:text-left md:gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="Orlando's Oasis" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold text-card">Orlando's Oasis</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm">
            <Link to="/privacy" className="transition-colors text-white hover:text-primary">Privacy Policy</Link>
            <Link to="/terms" className="transition-colors text-white hover:text-primary">Terms</Link>
            <Link to="/contact#get-in-touch" className="transition-colors text-white hover:text-primary">Contact Us</Link>
            <Link to="/technician" className="transition-colors text-white hover:text-primary">Apply as Pool Technician</Link>
          </nav>

          {/* Copyright */}
          <span className="text-xs md:text-sm text-slate-400 md:text-right">© 2026 Orlando's Oasis. All rights reserved.</span>
        </div>
      </div>
    </footer>);

};

export default Footer;