import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Pencil } from "lucide-react";
import BookingStepper from "@/components/BookingStepper";
import BookingContactForm from "@/components/BookingContactForm";
import BookingPaymentForm from "@/components/BookingPaymentForm";
import VoucherSelectionStep, { VOUCHER_PLANS } from "@/components/dashboard/VoucherSelectionStep";
import VoucherConfirmationStep from "@/components/dashboard/VoucherConfirmationStep";

const STEPS = [
  { label: "Voucher" },
  { label: "Confirm" },
  { label: "Your Details" },
  { label: "Payment" },
];

const ServicesSection = () => {
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState("weekly");
  const [currentStep, setCurrentStep] = useState(1);
  const [contactData, setContactData] = useState<any>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const selectedPlan = VOUCHER_PLANS.find((p) => p.id === selectedPlanId)!;
  const serviceName = selectedPlan.label.replace("Most Popular – ", "");

  const scrollToTop = useCallback(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleContinueStep1 = () => {
    setCurrentStep(2);
    setTimeout(scrollToTop, 50);
  };

  const handleContinueStep2 = () => {
    setCurrentStep(3);
    setTimeout(scrollToTop, 50);
  };

  const handleContactContinue = (data: any) => {
    setContactData(data);
    setCurrentStep(4);
    setTimeout(scrollToTop, 50);
  };

  const handlePaymentSubmit = () => {
    setBookingComplete(true);
    setTimeout(scrollToTop, 50);
  };

  const handleEditVoucher = () => {
    setCurrentStep(1);
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
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Get Professional Pool Service
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Complete cleaning, maintenance, and repair services for residential pools and spas.
        </p>
      </div>

      {currentStep >= 3 && <BookingStepper currentStep={currentStep} steps={STEPS} />}

      {/* Step 1: Voucher Selection */}
      {currentStep === 1 && (
        <>
          <VoucherSelectionStep selectedPlanId={selectedPlanId} onSelectPlan={setSelectedPlanId} />
          <Button
            onClick={handleContinueStep1}
            className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg mt-6"
          >
            Continue
          </Button>
        </>
      )}

      {/* Step 2: Voucher Confirmation */}
      {currentStep === 2 && (
        <>
          <VoucherConfirmationStep plan={selectedPlan} />
          <Button
            onClick={handleContinueStep2}
            className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg mt-6"
          >
            Continue
          </Button>
        </>
      )}

      {/* Step 3: Contact Details */}
      {currentStep === 3 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="mb-5 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground text-xs">Selected</Badge>
                <span className="text-sm font-semibold text-foreground">{serviceName}</span>
              </div>
              <button
                type="button"
                onClick={handleEditVoucher}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              ${selectedPlan.discountPrice}/first month (Save ${selectedPlan.savings})
            </p>
          </div>
          <BookingContactForm
            onContinue={handleContactContinue}
            onBack={() => { setCurrentStep(2); setTimeout(scrollToTop, 50); }}
            initialData={contactData}
          />
        </div>
      )}

      {/* Step 4: Payment */}
      {currentStep === 4 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="mb-5 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary text-primary-foreground text-xs">Selected</Badge>
                <span className="text-sm font-semibold text-foreground">{serviceName}</span>
              </div>
              <button
                type="button"
                onClick={handleEditVoucher}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              ${selectedPlan.discountPrice}/first month (Save ${selectedPlan.savings})
            </p>
          </div>
          <BookingPaymentForm
            onSubmit={handlePaymentSubmit}
            onBack={() => { setCurrentStep(3); setTimeout(scrollToTop, 50); }}
          />
        </div>
      )}
    </div>
  );
};

export default ServicesSection;
