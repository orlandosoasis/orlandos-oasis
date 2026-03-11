import { Link } from "react-router-dom";
import logo from "@/assets/orlando-oasis-logo.png";

const Header = () => {
  return (
    <header className="bg-card py-4 px-4 md:px-8">
      <div className="container max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Orlando's Oasis" className="h-8 w-8 object-contain" />
          <Link to="/" className="text-xl font-bold text-navy">Orlando's Oasis</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
