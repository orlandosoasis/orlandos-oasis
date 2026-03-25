import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/contexts/AuthContext";
import BookingFlow from "@/components/dashboard/BookingFlow";

const PurchaseSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkoutData } = useBooking();
  const { signup, login, isAuthenticated } = useAuth();

  const serviceName = searchParams.get("service") || checkoutData?.serviceName || "Pool Service";
  const serviceDescription = searchParams.get("description") || checkoutData?.serviceDescription || "";

  const [showBooking, setShowBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBookingComplete = async () => {
    // Auto-create account and login using checkout data
    if (!isAuthenticated && checkoutData?.customerEmail) {
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
        }
      );

      if (!signupResult.success) {
        await login(checkoutData.customerEmail, tempPassword);
      }
    }

    // Show success animation before redirecting
    setShowBooking(false);
    setShowSuccess(true);
    setTimeout(() => navigate("/dashboard"), 2200);
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

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="text-center space-y-5 px-6 max-w-md">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Payment Successful</h2>
        <p className="text-muted-foreground">
          Your {serviceName} is confirmed. Schedule your first service.
        </p>
        <Button
          onClick={() => setShowBooking(true)}
          className="mt-2 w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg"
        >
          Book My First Service
        </Button>
      </div>
    </div>
  );
};

export default PurchaseSuccess;
