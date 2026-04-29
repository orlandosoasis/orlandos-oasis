import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleRouteProps {
  roles: UserRole[];
  children: ReactNode;
}

const roleHome: Record<UserRole, string> = {
  homeowner: "/dashboard",
  technician: "/tech-dashboard",
  admin: "/admin-dashboard",
};

const RoleRoute = ({ roles, children }: RoleRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="max-w-[760px] mx-auto px-5 py-12 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
