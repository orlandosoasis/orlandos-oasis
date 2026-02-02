import { Waves } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-card py-4 px-4 md:px-8">
      <div className="container max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Waves className="h-5 w-5 text-primary" />
          <Link to="/" className="text-xl font-bold text-navy">Orlando's Oasis</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
