import { Navigate } from "react-router-dom";

/**
 * Technicians always land on the Jobs tab.
 * This route exists for backward compatibility with old links/bookmarks
 * and simply redirects to /tech/jobs without flicker.
 */
const TechnicianDashboard = () => {
  return <Navigate to="/tech/jobs" replace />;
};

export default TechnicianDashboard;
