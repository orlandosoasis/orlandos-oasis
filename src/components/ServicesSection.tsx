import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import BookingStepper from "@/components/BookingStepper";
import BookingPaymentForm from "@/components/BookingPaymentForm";
import VoucherSelectionStep, { VOUCHER_PLANS } from "@/components/dashboard/VoucherSelectionStep";
import VoucherConfirmationStep from "@/components/dashboard/VoucherConfirmationStep";
import LandingContactStep, { type LandingFormData } from "@/components/LandingContactStep";

const STEPS = [
  { label: "Voucher" },
  { label: "Your Details" },
  { label: "Confirm" },
  { label: "Payment" },
];

const ServicesSection = () => {
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState("weekly");
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
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Payment Successful</h2>
        <p className="text-muted-foreground">
          Your pool service <strong>{serviceName}</strong> has been successfully booked.
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
          className="mt-4"
        >
          Schedule Pool Service
        </Button>
      </div>
    );
  }

  return (
    <div id="discount-voucher" className="scroll-mt-8" ref={sectionRef}>

      {currentStep >= 3 && <BookingStepper currentStep={currentStep} steps={STEPS} />}

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
        <div className="bg-card border border-border rounded-xl p-6">
          <BookingPaymentForm
            onSubmit={handlePaymentSubmit}
            onBack={() => goToStep(3)}
          />
        </div>
      )}
    </div>
  );
};

export default ServicesSection;
