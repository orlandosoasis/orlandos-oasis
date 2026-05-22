import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingProvider } from "@/contexts/BookingContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import EmailVerificationBanner from "@/components/EmailVerificationBanner";
import CookieConsent from "@/components/CookieConsent";
import { initMonitoring } from "@/lib/monitoring";

// Initialize monitoring shims (errors + analytics, gated on consent).
initMonitoring();

// Eagerly preload logo assets so they render instantly on navigation
import ooLogo from "@/assets/oo-logo.png";

const preloadImage = (src: string) => {
  const img = new Image();
  img.src = src;
};
preloadImage(ooLogo);

// ============================================================================
// Eagerly imported (small, on landing path, or wraps many routes)
// ============================================================================
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import WelcomeBack from "./pages/WelcomeBack";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Services from "./pages/Services";
import ServiceAreas from "./pages/ServiceAreas";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import TechnicianLanding from "./pages/TechnicianLanding";
import TechnicianApplication from "./pages/TechnicianApplication";
import CustomerLayout from "./components/CustomerLayout";
import RoleRoute from "./components/RoleRoute";

// ============================================================================
// Lazy-loaded (large, role-gated, or rarely visited - code-split out of the
// main bundle to keep initial load fast for marketing pages)
// ============================================================================
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ServicePass = lazy(() => import("./pages/ServicePass"));
const ServiceDetails = lazy(() => import("./pages/ServiceDetails"));
const Messages = lazy(() => import("./pages/Messages"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Profile = lazy(() => import("./pages/Profile"));
const PurchaseSuccess = lazy(() => import("./pages/PurchaseSuccess"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const PersonalInfo = lazy(() => import("./pages/settings/PersonalInfo"));
const PaymentMethods = lazy(() => import("./pages/settings/PaymentMethods"));
const ManagePlan = lazy(() => import("./pages/settings/ManagePlan"));
const CleaningAddress = lazy(() => import("./pages/settings/CleaningAddress"));
const CleaningNotes = lazy(() => import("./pages/settings/CleaningNotes"));
const Preferences = lazy(() => import("./pages/settings/Preferences"));
const ExperienceLevel = lazy(() => import("./pages/settings/ExperienceLevel"));

const TechnicianDashboard = lazy(() => import("./pages/TechnicianDashboard"));
const TechPoolList = lazy(() => import("./pages/TechPoolList"));
const TechPoolDetails = lazy(() => import("./pages/TechPoolDetails"));
const TechServiceDetails = lazy(() => import("./pages/TechServiceDetails"));
const TechSchedule = lazy(() => import("./pages/TechSchedule"));
const TechCompletedServices = lazy(() => import("./pages/TechCompletedServices"));
const TechJobs = lazy(() => import("./pages/TechJobs"));
const TechJobDetail = lazy(() => import("./pages/TechJobDetail"));
const TechMessages = lazy(() => import("./pages/TechMessages"));

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className="flex min-h-screen items-center justify-center"
  >
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
    <span className="sr-only">Loading…</span>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BookingProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <EmailVerificationBanner />
              <CookieConsent />
              <Suspense fallback={<RouteFallback />}>
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
                    <Route path="/account-settings/manage-plan" element={<ManagePlan />} />
                    <Route path="/account-settings/cleaning-address" element={<CleaningAddress />} />
                    <Route path="/account-settings/cleaning-notes" element={<CleaningNotes />} />
                    <Route path="/account-settings/preferences" element={<Preferences />} />
                    <Route path="/account-settings/experience-level" element={<ExperienceLevel />} />
                  </Route>

                  {/* Purchase success self-handles account creation, so it must be public */}
                  <Route path="/purchase-success" element={<PurchaseSuccess />} />

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
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </BookingProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
