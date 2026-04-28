import { Link } from "react-router-dom";
import logo from "@/assets/oo-logo.png";

const Footer = () => {
  return (
    <footer className="py-8" style={{ background: 'hsl(210 60% 12%)' }}>
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center justify-center text-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Orlando's Oasis" className="h-8 w-8 object-contain" />
              <span className="text-xl font-bold text-card">Orlando's Oasis</span>
            </div>
            
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link to="/privacy" className="transition-colors text-white hover:text-primary">Privacy Policy</Link>
              <Link to="/terms" className="transition-colors text-white hover:text-primary">Terms</Link>
              <Link to="/contact#get-in-touch" className="transition-colors text-white hover:text-primary">Contact Us</Link>
              <Link to="/technician" className="transition-colors text-white hover:text-primary">Apply as Pool Technician</Link>
            </nav>
          </div>

          <span className="text-sm text-slate-500">© 2026 Orlando's Oasis. All rights reserved.</span>
        </div>
      </div>
    </footer>);

};

export default Footer;