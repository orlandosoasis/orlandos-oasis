import { Waves } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-navy py-8">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-oasis" />
            <span className="text-lg font-bold text-card">Orlando's Oasis</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-card/70">
            <a href="#" className="hover:text-card transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-card transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-card transition-colors">Contact Us</a>
            <a href="#" className="hover:text-card transition-colors">FAQ</a>
          </div>

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
