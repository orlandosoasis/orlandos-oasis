import { Sparkles } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-navy py-8">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-card">homeaglow</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-card/70">
            <a href="#" className="hover:text-card transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-card transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-card transition-colors">Contact Us</a>
            <a href="#" className="hover:text-card transition-colors">FAQ</a>
          </div>
          
          <p className="text-sm text-card/60">
            © 2024 Homeaglow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
