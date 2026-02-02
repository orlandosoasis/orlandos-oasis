import { Sparkles } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-card py-4 px-4 md:px-8">
      <div className="container max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-xl font-bold text-navy">homeaglow</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
