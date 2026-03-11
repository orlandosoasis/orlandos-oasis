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
            <Link to="/terms" className="hover:text-card transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-card transition-colors">Privacy Policy</Link>
            <a href="#" className="hover:text-card transition-colors">Contact Us</a>
            <a href="#" className="hover:text-card transition-colors">FAQ</a>
          </div>

          <Link to="/technician" className="text-sm text-oasis-aqua hover:text-card transition-colors font-semibold">
            Apply as a Pool Technician
          </Link>

          <Link to="/login" className="text-sm text-oasis hover:text-oasis-aqua transition-colors font-medium">
            Log In
          </Link>
          
          <p className="text-sm text-card/60">
            © 2026 Orlando's Oasis. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
