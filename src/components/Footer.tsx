import { Link } from "react-router-dom";
import logo from "@/assets/orlando-oasis-logo.png";

const Footer = () => {
  return (
    <footer className="bg-navy py-8">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Orlando's Oasis" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold text-card">Orlando's Oasis</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-card/70">
            <Link to="/terms" className="transition-colors text-white">Terms</Link>
            <Link to="/privacy" className="transition-colors text-white">Privacy</Link>
            <a href="#" className="transition-colors text-white">Contact Us</a>
            <a href="#" className="transition-colors text-white">FAQ</a>
          </div>

          <Link to="/technician" className="text-sm text-oasis-aqua hover:text-card transition-colors font-medium">
            Apply as a Pool Technician
          </Link>

          <Link to="/login" className="text-sm transition-colors font-medium text-oasis-aqua">
            Log In
          </Link>
          
          <p className="text-sm text-slate-500">
            © 2026 Orlando's Oasis. All rights reserved.
          </p>
        </div>
      </div>
    </footer>);

};

export default Footer;