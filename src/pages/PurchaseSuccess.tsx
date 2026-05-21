import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, CheckCircle2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/contexts/AuthContext";
import BookingFlow from "@/components/dashboard/BookingFlow";

const PurchaseSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkoutData } = useBooking();
  const { signup, login, logout, isAuthenticated, user, isLoading } = useAuth();

  const serviceName = searchParams.get("service") || checkoutData?.serviceName || "Pool Service";
  const serviceDescription = searchParams.get("description") || checkoutData?.serviceDescription || "";

  const [showBooking, setShowBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [signupAttempted, setSignupAttempted] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Auto-create the homeowner account immediately after payment so the
  // scheduling flow that follows is performed as an authenticated user
  // with the latest checkout data already merged into their profile.
  useEffect(() => {
    if (isLoading || signupAttempted) return;
    let cancelled = false;
    const ensureAccount = async () => {
      // Already signed in (e.g. existing customer) — nothing to do.
      if (isAuthenticated) {
        setSignupAttempted(true);
        return;
      }
      if (!checkoutData?.customerEmail) {
        setSignupAttempted(true);
        return;
      }
      const tempPassword = `Oasis${Date.now()}!`;
      const fullName = `${checkoutData.customerFirstName} ${checkoutData.customerLastName}`.trim();
      const signupResult = await signup(
        checkoutData.customerEmail,
        tempPassword,
        fullName,
        "homeowner",
        {
          phone: checkoutData.customerPhone,
          firstName: checkoutData.customerFirstName,
          lastName: checkoutData.customerLastName,
          zipCode: checkoutData.customerZipcode,
          contractLocked: true,
        }
      );
      // If the account already exists, fall back to login with the same temp password.
      // (For pre-existing accounts the user will continue as a guest; the scheduling
      // flow still resumes from the locally persisted checkout data.)
      if (!signupResult.success) {
        const loginResult = await login(checkoutData.customerEmail, tempPassword);
        if (!loginResult.success && !cancelled) {
          setSignupError(signupResult.error || null);
        }
      }
      if (!cancelled) setSignupAttempted(true);
    };
    ensureAccount();
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, signupAttempted, checkoutData, signup, login]);

  // Account is "ready" once we have a hydrated user OR we've already
  // attempted signup (covers the email-confirmation case where the
  // session isn't established yet — booking flow can still resume from
  // the persisted checkoutData).
  const accountReady = !isLoading && (!!user || signupAttempted);

  // Auto-open the scheduling flow as soon as the account is ready, so the
  // user lands directly on the booking step for their purchased service
  // (no extra click, no detour through /login).
  useEffect(() => {
    if (accountReady && !showBooking && !showSuccess) {
      setShowBooking(true);
    }
  }, [accountReady, showBooking, showSuccess]);



  const handleBookingComplete = () => {
    // Scheduling flow finished — clear any saved partial progress and head to dashboard.
    try { localStorage.removeItem("orlandos_oasis_pending_schedule"); } catch { /* ignore */ }
    setShowBooking(false);
    setShowSuccess(true);
    // Always send the homeowner to their customer dashboard, even if the
     // current session belongs to another role (e.g. admin testing the flow).
     setTimeout(() => navigate("/dashboard", { replace: true, state: { forceHomeowner: true } }), 2200);
  };

  // Brief success screen after booking
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center space-y-4 px-6 max-w-sm animate-scale-in">
          <div className="mx-auto h-20 w-20 rounded-full bg-green-500/15 flex items-center justify-center animate-[pulse_1.5s_ease-in-out_1]">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-foreground animate-fade-in">You're All Set! 🎉</h2>
          <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
            Your first service is booked. Taking you to your dashboard…
          </p>
          <div className="pt-2 animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
            <div className="mx-auto h-1 w-32 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-[slide-progress_2s_ease-in-out_forwards]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showBooking) {
    return (
      <BookingFlow
        onClose={() => setShowBooking(false)}
        onComplete={handleBookingComplete}
        selectedService={{ title: serviceName, description: serviceDescription }}
        standalone
      />
    );
  }

  // Purchase Successful screen with the mandatory scheduling CTA.
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="text-center space-y-5 px-6 max-w-md">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Purchase Successful</h2>
        <p className="text-muted-foreground">
          Your <span className="font-semibold text-foreground">{serviceName}</span> plan is confirmed.
          Next, schedule your first service so we can match you with a technician.
        </p>
        <Button
          onClick={() => setShowBooking(true)}
          disabled={!accountReady}
          className="mt-2 w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg"
        >
          <Calendar className="h-5 w-5 mr-2" />
          {accountReady ? "Schedule My Pool Service" : "Setting up your account…"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Scheduling is required to activate your service. You can pause and resume — we'll save your progress.
        </p>
        {signupError && (
          <p className="text-xs text-destructive">{signupError}</p>
        )}
      </div>
    </div>
  );
};

export default PurchaseSuccess;
