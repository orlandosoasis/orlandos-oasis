import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import BookingStepper from "@/components/BookingStepper";
import VoucherSelectionStep, { VOUCHER_PLANS } from "@/components/dashboard/VoucherSelectionStep";
import VoucherConfirmationStep from "@/components/dashboard/VoucherConfirmationStep";
import LandingContactStep, { type LandingFormData } from "@/components/LandingContactStep";
import LandingPaymentStep from "@/components/LandingPaymentStep";

const STEPS = [
  { label: "Voucher" },
  { label: "Your Details" },
  { label: "Confirm" },
  { label: "Payment" },
];

const ServicesSection = () => {
  const navigate = useNavigate();
  const { signup, login, isAuthenticated } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState("weekly");
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [formData, setFormData] = useState<LandingFormData>({
    firstName: "",
    lastName: "",
    email: "",
    zipcode: "",
    phone: "",
    frequency: "biweekly",
  });
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 53 });
  const sectionRef = useRef<HTMLDivElement>(null);

  const selectedPlan = VOUCHER_PLANS.find((p) => p.id === selectedPlanId)!;
  const serviceName = selectedPlan.label.replace("Most Popular – ", "");

  useEffect(() => {
    if (currentStep < 2) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep]);

  const scrollToTop = useCallback(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    setTimeout(scrollToTop, 50);
  };

  const handlePaymentSubmit = () => {
    setBookingComplete(true);
    setTimeout(scrollToTop, 50);
  };

  if (bookingComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center space-y-5 px-6 max-w-md">
          <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Payment Successful</h2>
          <p className="text-muted-foreground">
            Your <strong>{serviceName}</strong> is confirmed. You can now schedule your first cleaning.
          </p>
          <Button
            onClick={() => {
              const params = new URLSearchParams({
                openBooking: "true",
                serviceTitle: serviceName,
                serviceDescription: selectedPlan.description,
              });
              navigate(`/dashboard?${params.toString()}`);
            }}
            className="mt-2 w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg"
          >
            Schedule Pool Service
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div id="discount-voucher" className="scroll-mt-8" ref={sectionRef}>

      {currentStep >= 3 && <BookingStepper currentStep={currentStep} steps={STEPS} onStepClick={goToStep} />}

      {/* Step 1: Voucher Selection */}
      {currentStep === 1 && (
        <>
          <VoucherSelectionStep selectedPlanId={selectedPlanId} onSelectPlan={setSelectedPlanId} />
          <Button
            onClick={() => goToStep(2)}
            className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg mt-6"
          >
            Continue
          </Button>
        </>
      )}

      {/* Step 2: Your Details (Contact + Frequency) */}
      {currentStep === 2 && (
        <LandingContactStep
          selectedPlan={selectedPlan}
          timeLeft={timeLeft}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={() => goToStep(3)}
          onChangePlan={setSelectedPlanId}
        />
      )}

      {/* Step 3: Voucher Confirmation */}
      {currentStep === 3 && (
        <>
          <VoucherConfirmationStep plan={selectedPlan} />
          <Button
            onClick={() => goToStep(4)}
            className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg mt-6"
          >
            Continue
          </Button>
        </>
      )}

      {/* Step 4: Payment */}
      {currentStep === 4 && (
        <LandingPaymentStep
          selectedPlan={selectedPlan}
          timeLeft={timeLeft}
          email={formData.email}
          onChangePlan={setSelectedPlanId}
          onContinue={handlePaymentSubmit}
        />
      )}
    </div>
  );
};

export default ServicesSection;
