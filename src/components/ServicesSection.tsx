import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
  { label: "Service" },
  { label: "Details" },
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
  const { setCheckoutData } = useBooking();

  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>({
    poolSize: "small",
    frequency: "weekly",
  });
  const [currentStep, setCurrentStep] = useState(1);
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
      poolSize: serviceConfig.poolSize,
      originalPrice: selectedPlan.originalPrice,
      discountPrice: selectedPlan.discountPrice,
      customerEmail: formData.email,
      customerFirstName: formData.firstName,
      customerLastName: formData.lastName,
      customerPhone: formData.phone,
      customerZipcode: formData.zipcode,
    });

    navigate(
      `/purchase-success?service=${encodeURIComponent(serviceName)}&description=${encodeURIComponent(selectedPlan.description)}`
    );
  };

  const renderFooterCta = () => {
    if (currentStep === 1) {
      return (
        <Button
          onClick={() => goToStep(2)}
          className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg"
        >
          Continue
        </Button>
      );
    }
    if (currentStep === 3) {
      return (
        <Button
          onClick={() => goToStep(4)}
          className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg"
        >
          {selectedAddons.length > 0
            ? `Continue with ${selectedAddons.length} add-on${selectedAddons.length > 1 ? "s" : ""}`
            : "Continue"}
        </Button>
      );
    }
    if (currentStep === 4) {
      return (
        <Button
          onClick={() => goToStep(5)}
          className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg"
        >
          Continue
        </Button>
      );
    }
    return null;
  };

  const footer = renderFooterCta();

  return (
    <div
      id="discount-voucher"
      className="scroll-mt-8 lg:flex lg:flex-col lg:h-full lg:min-h-0"
      ref={sectionRef}
    >
      <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:p-6 lg:bg-slate-50 lg:[scrollbar-width:thin] lg:[scrollbar-color:hsl(var(--border))_transparent] lg:[&::-webkit-scrollbar]:w-1.5 lg:[&::-webkit-scrollbar-track]:bg-transparent lg:[&::-webkit-scrollbar-thumb]:bg-border lg:[&::-webkit-scrollbar-thumb]:rounded-full">
        {currentStep >= 2 && (
          <BookingStepper currentStep={currentStep} steps={STEPS} onStepClick={goToStep} />
        )}

        {currentStep === 1 && (
          <ServiceConfigStep config={serviceConfig} onConfigChange={setServiceConfig} />
        )}

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

        {currentStep === 3 && (
          <AddonsStep
            selectedAddons={selectedAddons}
            onToggleAddon={handleToggleAddon}
            serviceConfig={serviceConfig}
            timeLeft={timeLeft}
            onChangePlan={() => goToStep(1)}
          />
        )}

        {currentStep === 4 && (
          <VoucherConfirmationStep
            plan={selectedPlan}
            serviceConfig={serviceConfig}
            selectedAddons={selectedAddons}
            timeLeft={timeLeft}
          />
        )}

        {currentStep === 5 && (
          <LandingPaymentStep
            selectedPlan={selectedPlan}
            timeLeft={timeLeft}
            email={formData.email}
            onChangePlan={() => goToStep(1)}
            onContinue={handlePaymentSubmit}
            selectedAddons={selectedAddons}
          />
        )}

        {/* Mobile CTA: inline at bottom of content */}
        {footer && <div className="mt-6 lg:hidden">{footer}</div>}
      </div>

      {/* Desktop CTA: pinned footer inside card */}
      {footer && (
        <div className="hidden lg:block lg:shrink-0 lg:border-t lg:border-border lg:bg-card lg:p-4">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ServicesSection;
