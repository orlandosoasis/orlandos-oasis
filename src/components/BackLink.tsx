import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackLinkProps {
  to?: string;
  label?: string;
  className?: string;
}

const BackLink = ({ to = "/account-settings", label = "Back", className = "" }: BackLinkProps) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className={`mb-4 inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors ${className}`}
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
};

export default BackLink;
