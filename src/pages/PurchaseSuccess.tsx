import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check } from "lucide-react";
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

    navigate("/dashboard");
  };

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
