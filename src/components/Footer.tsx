import { Link } from "react-router-dom";
import logo from "@/assets/oo-logo.png";

const Footer = () => {
  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      className="pt-10 md:pt-14 pb-8"
      style={{ background: "hsl(210 60% 12%)" }}
    >
      <div className="container max-w-6xl mx-auto px-4 md:px-6 animate-fade-in">
        {/* Top: brand + grouped links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
          {/* Brand */}
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-2">
              <img src={logo} alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold text-white">Orlando's Oasis</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              Reliable, professional pool care across Central Florida.
            </p>
          </div>

          {/* Link groups */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 sm:grid-cols-2 gap-6 md:justify-items-end"
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Company
              </h3>
              <Link
                to="/contact#get-in-touch"
                className="text-sm text-white hover:text-primary transition-colors"
              >
                Contact Us
              </Link>
              <Link
                to="/technician"
                className="text-sm text-white hover:text-primary transition-colors"
              >
                Apply as Pool Technician
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Legal
              </h3>
              <Link
                to="/privacy"
                className="text-sm text-white hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-sm text-white hover:text-primary transition-colors"
              >
                Terms
              </Link>
            </div>
          </nav>
        </div>

        {/* Divider + copyright */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-xs md:text-sm text-slate-400">
            © 2026 Orlando's Oasis. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
