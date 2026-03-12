import { Link } from "react-router-dom";
import logo from "@/assets/oasis-logo-circle.png";

interface BrandLogoProps {
  size?: "sm" | "lg";
  className?: string;
}

const BrandLogo = ({ size = "sm", className }: BrandLogoProps) => {
  const imgSize = size === "lg" ? "h-8 w-8" : "h-6 w-6";
  const textSize = size === "lg" ? "text-2xl" : "text-[1.25rem]";

  return (
    <Link to="/" className={`flex items-center gap-1.5 ${className ?? ""}`}>
      <img src={logo} alt="Orlando's Oasis" className={`${imgSize} object-contain`} />
      <span className={`${textSize} font-bold tracking-tight`}>Orlando's Oasis</span>
    </Link>
  );
};

export default BrandLogo;
