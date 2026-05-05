import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingProvider } from "@/contexts/BookingContext";

// Eagerly preload logo assets so they render instantly on navigation
import ooLogo from "@/assets/oo-logo.png";

const preloadImage = (src: string) => {
  const img = new Image();
  img.src = src;
};
preloadImage(ooLogo);

import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import WelcomeBack from "./pages/WelcomeBack";
import Dashboard from "./pages/Dashboard";
import ServicePass from "./pages/ServicePass";
import ServiceDetails from "./pages/ServiceDetails";
import Messages from "./pages/Messages";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import HelpCenter from "./pages/HelpCenter";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import Profile from "./pages/Profile";

import AccountSettings from "./pages/AccountSettings";
import PersonalInfo from "./pages/settings/PersonalInfo";
import PaymentMethods from "./pages/settings/PaymentMethods";
import CleaningAddress from "./pages/settings/CleaningAddress";
import CleaningNotes from "./pages/settings/CleaningNotes";
import Preferences from "./pages/settings/Preferences";
import ExperienceLevel from "./pages/settings/ExperienceLevel";
import TechnicianLanding from "./pages/TechnicianLanding";
import ServiceAreas from "./pages/ServiceAreas";
import TechnicianApplication from "./pages/TechnicianApplication";
import TechPoolList from "./pages/TechPoolList";
import TechPoolDetails from "./pages/TechPoolDetails";
import TechServiceDetails from "./pages/TechServiceDetails";
import TechSchedule from "./pages/TechSchedule";
import TechCompletedServices from "./pages/TechCompletedServices";
import TechJobs from "./pages/TechJobs";
import TechJobDetail from "./pages/TechJobDetail";
import TechMessages from "./pages/TechMessages";
import AdminDashboard from "./pages/AdminDashboard";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Services from "./pages/Services";
import PurchaseSuccess from "./pages/PurchaseSuccess";
import CustomerLayout from "./components/CustomerLayout";
import RoleRoute from "./components/RoleRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BookingProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/welcome-back" element={<WelcomeBack />} />

            {/* Customer pages with persistent header (homeowner only) */}
            <Route element={<RoleRoute roles={["homeowner"]}><CustomerLayout /></RoleRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/passes" element={<ServicePass />} />
              <Route path="/service/:serviceId" element={<ServiceDetails />} />
              <Route path="/service-details" element={<ServiceDetails />} />
              <Route path="/service-details/completed" element={<ServiceDetails />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/account-settings" element={<AccountSettings />} />
              <Route path="/account-settings/personal-info" element={<PersonalInfo />} />
              <Route path="/account-settings/payment-methods" element={<PaymentMethods />} />
              <Route path="/account-settings/cleaning-address" element={<CleaningAddress />} />
              <Route path="/account-settings/cleaning-notes" element={<CleaningNotes />} />
              <Route path="/account-settings/preferences" element={<Preferences />} />
              <Route path="/account-settings/experience-level" element={<ExperienceLevel />} />
              <Route path="/purchase-success" element={<PurchaseSuccess />} />
            </Route>

            {/* Public pages */}
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/service-areas" element={<ServiceAreas />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/technician" element={<TechnicianLanding />} />
            <Route path="/technician/apply" element={<TechnicianApplication />} />
            <Route path="/contact" element={<Contact />} />

            {/* Technician routes */}
            <Route path="/tech-dashboard" element={<RoleRoute roles={["technician"]}><TechnicianDashboard /></RoleRoute>} />
            <Route path="/tech/pools" element={<RoleRoute roles={["technician"]}><TechPoolList /></RoleRoute>} />
            <Route path="/tech/pools/:poolId" element={<RoleRoute roles={["technician"]}><TechPoolDetails /></RoleRoute>} />
            <Route path="/tech/service/:serviceId" element={<RoleRoute roles={["technician"]}><TechServiceDetails /></RoleRoute>} />
            <Route path="/tech/schedule" element={<RoleRoute roles={["technician"]}><TechSchedule /></RoleRoute>} />
            <Route path="/tech/completed" element={<RoleRoute roles={["technician"]}><TechCompletedServices /></RoleRoute>} />
            <Route path="/tech/jobs" element={<RoleRoute roles={["technician"]}><TechJobs /></RoleRoute>} />
            <Route path="/tech/jobs/:serviceId" element={<RoleRoute roles={["technician"]}><TechJobDetail /></RoleRoute>} />
            <Route path="/tech/messages" element={<RoleRoute roles={["technician"]}><TechMessages /></RoleRoute>} />

            {/* Admin routes */}
            <Route path="/admin-dashboard" element={<RoleRoute roles={["admin"]}><AdminDashboard /></RoleRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </BookingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
