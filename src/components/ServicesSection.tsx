import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/contexts/BookingContext";
import BookingStepper from "@/components/BookingStepper";
import ServiceConfigStep, {
  type ServiceConfig,
  getMonthlyPrice,
  getDiscountPrice,
  getFrequencyLabel,
} from "@/components/ServiceConfigStep";
import VoucherConfirmationStep from "@/components/dashboard/VoucherConfirmationStep";
import LandingContactStep, { type LandingFormData } from "@/components/LandingContactStep";
import LandingPaymentStep from "@/components/LandingPaymentStep";
import AddonsStep from "@/components/AddonsStep";
import type { VoucherPlan } from "@/components/dashboard/VoucherSelectionStep";

const STEPS = [
  { label: "Select Service" },
  { label: "Your Details" },
  { label: "Add-ons" },
  { label: "Confirmation" },
  { label: "Payment" },
];

/** Derive a VoucherPlan-compatible object from ServiceConfig for downstream steps */
function configToPlan(config: ServiceConfig): VoucherPlan {
  const monthlyPrice = getMonthlyPrice(config);
  const discountPrice = getDiscountPrice(config);
  const label = getFrequencyLabel(config.frequency);
  return {
    id: `${config.poolSize}-${config.frequency}`,
    label,
    description: `${label} · ${config.poolSize.charAt(0).toUpperCase() + config.poolSize.slice(1)} pool`,
    originalPrice: monthlyPrice,
    discountPrice,
    savings: 25,
    isMostPopular: config.frequency === "weekly",
  };
}

const ServicesSection = () => {
  const navigate = useNavigate();
  const { signup, login, isAuthenticated } = useAuth();
  const { setCheckoutData } = useBooking();

  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>({
    poolSize: "small",
    frequency: "weekly",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
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

  const selectedPlan = configToPlan(serviceConfig);
  const serviceName = selectedPlan.label;

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

  const handleToggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handlePaymentSubmit = async () => {
    setCheckoutData({
      serviceName,
      serviceDescription: selectedPlan.description,
      frequency: serviceConfig.frequency,
      originalPrice: selectedPlan.originalPrice,
      discountPrice: selectedPlan.discountPrice,
      customerEmail: formData.email,
      customerFirstName: formData.firstName,
      customerLastName: formData.lastName,
      customerPhone: formData.phone,
      customerZipcode: formData.zipcode,
    });

    if (!isAuthenticated && formData.email) {
      const tempPassword = `Oasis${Date.now()}!`;
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const signupResult = await signup(formData.email, tempPassword, fullName, "homeowner", {
        phone: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (!signupResult.success) {
        const loginResult = await login(formData.email, tempPassword);
        if (!loginResult.success) {
          setAutoLoginFailed(true);
        }
      }
    }

    setBookingComplete(true);
    setTimeout(scrollToTop, 50);
  };

  if (bookingComplete) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="text-center space-y-5 px-6 max-w-md">
          {autoLoginFailed}
          <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Payment Successful</h2>
          <p className="text-muted-foreground">Your {serviceName} is confirmed. Schedule your first service.</p>
          <Button
            onClick={() =>
              navigate(
                `/dashboard?openBooking=true&serviceTitle=${encodeURIComponent(serviceName)}&serviceDescription=${encodeURIComponent(selectedPlan.description)}`
              )
            }
            className="mt-2 w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg"
          >
            Schedule a Service
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div id="discount-voucher" className="scroll-mt-8" ref={sectionRef}>
      {currentStep >= 2 && <BookingStepper currentStep={currentStep} steps={STEPS} onStepClick={goToStep} />}

      {/* Step 1: Configure Pool Size + Frequency */}
      {currentStep === 1 && (
        <>
          <ServiceConfigStep config={serviceConfig} onConfigChange={setServiceConfig} />
          <Button
            onClick={() => goToStep(2)}
            className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg mt-6"
          >
            Continue
          </Button>
        </>
      )}

      {/* Step 2: Your Details */}
      {currentStep === 2 && (
        <LandingContactStep
          selectedPlan={selectedPlan}
          serviceConfig={serviceConfig}
          timeLeft={timeLeft}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={() => goToStep(3)}
          onChangePlan={() => goToStep(1)}
        />
      )}

      {/* Step 3: Add-ons */}
      {currentStep === 3 && (
        <>
          <AddonsStep selectedAddons={selectedAddons} onToggleAddon={handleToggleAddon} />
          <Button
            onClick={() => goToStep(4)}
            className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg mt-6"
          >
            {selectedAddons.length > 0
              ? `Continue with ${selectedAddons.length} add-on${selectedAddons.length > 1 ? "s" : ""}`
              : "Skip & Continue"}
          </Button>
        </>
      )}

      {/* Step 4: Confirmation */}
      {currentStep === 4 && (
        <>
          <VoucherConfirmationStep plan={selectedPlan} />
          <Button
            onClick={() => goToStep(5)}
            className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg mt-6"
          >
            Continue
          </Button>
        </>
      )}

      {/* Step 5: Payment */}
      {currentStep === 5 && (
        <LandingPaymentStep
          selectedPlan={selectedPlan}
          timeLeft={timeLeft}
          email={formData.email}
          onChangePlan={() => goToStep(1)}
          onContinue={handlePaymentSubmit}
        />
      )}
    </div>
  );
};

export default ServicesSection;
