import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Check, Pencil } from "lucide-react";
import BookingStepper from "@/components/BookingStepper";
import BookingContactForm from "@/components/BookingContactForm";
import BookingPaymentForm from "@/components/BookingPaymentForm";

const SERVICE_CATEGORIES = [
  {
    label: "Cleaning & Maintenance",
    services: [
      {
        id: "weekly-cleaning",
        title: "Weekly Pool / Spa Cleaning",
        description: "Regular service that includes skimming debris, brushing walls, vacuuming the pool or spa, and emptying baskets to keep the water clean and clear.",
      },
      {
        id: "chemical-balancing",
        title: "Chemical Testing & Balancing",
        description: "Technicians test and adjust chlorine, pH, alkalinity, and other chemicals to keep pool water safe and properly balanced.",
      },
      {
        id: "filter-cleaning",
        title: "Filter / Salt Cell Cleaning",
        description: "Cleaning the filtration system and salt cell to maintain proper circulation and chlorine generation.",
      },
      {
        id: "tile-cleaning",
        title: "Tile & Surface Cleaning",
        description: "Removal of calcium buildup and stains from waterline tile and pool surfaces.",
      },
    ],
  },
  {
    label: "Repairs & Equipment",
    services: [
      {
        id: "equipment-inspection",
        title: "Pool Equipment Inspection",
        description: "Inspection of pumps, motors, valves, and heaters to identify potential issues early.",
      },
      {
        id: "equipment-repair",
        title: "Pool Equipment Repair",
        description: "Repair or replacement of pumps, motors, lights, and other pool equipment when needed.",
      },
    ],
  },
  {
    label: "Deep Cleaning & Restoration",
    services: [
      {
        id: "algae-treatment",
        title: "Green-to-Clean / Algae Treatment",
        description: "Deep cleaning and chemical treatment to restore pools affected by algae or green water.",
      },
      {
        id: "acid-washing",
        title: "Acid Washing",
        description: "Deep surface cleaning to remove stains, mineral buildup, and embedded algae.",
      },
    ],
  },
  {
    label: "Pool Setup & Evaluation",
    services: [
      {
        id: "pool-inspections",
        title: "Pool Inspections",
        description: "Evaluation of pool condition including water clarity, equipment performance, and safety components.",
      },
      {
        id: "pool-startups",
        title: "Pool Startups",
        description: "Initial service after a new pool build or resurfacing to balance chemicals and start equipment.",
      },
    ],
  },
];

const STEPS = [
  { label: "Service" },
  { label: "Your Details" },
  { label: "Payment" },
];

const ServicesSection = () => {
  const [selected, setSelected] = useState<string | null>("weekly-cleaning");
  const [currentStep, setCurrentStep] = useState(1);
  const [contactData, setContactData] = useState<any>(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const allServices = SERVICE_CATEGORIES.flatMap((c) => c.services);
  const selectedService = allServices.find((s) => s.id === selected);

  const scrollToTop = useCallback(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleServiceSelect = (serviceId: string) => {
    setSelected(serviceId);
  };

  const handleContinueToDetails = () => {
    if (selected) {
      setCurrentStep(2);
      setTimeout(scrollToTop, 50);
    }
  };

  const handleContactContinue = (data: any) => {
    setContactData(data);
    setCurrentStep(3);
    setTimeout(scrollToTop, 50);
  };

  const handlePaymentSubmit = () => {
    setBookingComplete(true);
    setTimeout(scrollToTop, 50);
  };

  const handleEditService = () => {
    setCurrentStep(1);
    setTimeout(scrollToTop, 50);
  };

  const handleReset = () => {
    setSelected(null);
    setCurrentStep(1);
    setContactData(null);
    setBookingComplete(false);
  };

  if (bookingComplete) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Booking Confirmed!</h2>
        <p className="text-muted-foreground">
          We'll reach out shortly to confirm your <strong>{selectedService?.title}</strong> appointment.
        </p>
        <Button variant="outline" onClick={handleReset} className="mt-4">
          Book Another Service
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

      {/* Stepper — visible once a service is selected */}
      {selected && (
        <BookingStepper currentStep={currentStep} steps={STEPS} />
      )}

      {/* Step 1: Service Selection */}
      {currentStep === 1 && (
        <>
          <RadioGroup
            value={selected || ""}
            onValueChange={handleServiceSelect}
            className="space-y-6"
          >
            {SERVICE_CATEGORIES.map((category) => (
              <div key={category.label}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {category.label}
                </h3>
                <div className="space-y-3">
                  {category.services.map((service) => (
                    <label
                      key={service.id}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        selected === service.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border bg-card hover:border-primary"
                      }`}
                    >
                      <RadioGroupItem value={service.id} className="mt-1 shrink-0" />
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground mb-1">
                          {service.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {service.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </RadioGroup>

          <Button
            onClick={handleContinueToDetails}
            disabled={!selected}
            className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg mt-6"
          >
            {selected ? "Continue" : "Select a service to continue"}
          </Button>
        </>
      )}

      {/* Step 2: Contact Details */}
      {currentStep === 2 && (
        <div className="bg-card border border-border rounded-xl p-6">
          {selectedService && (
            <div className="mb-5 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-xs">Selected</Badge>
              <span className="text-sm font-semibold text-foreground">{selectedService.title}</span>
            </div>
          )}
          <BookingContactForm
            onContinue={handleContactContinue}
            onBack={() => setCurrentStep(1)}
            initialData={contactData}
          />
        </div>
      )}

      {/* Step 3: Payment */}
      {currentStep === 3 && (
        <div className="bg-card border border-border rounded-xl p-6">
          {selectedService && (
            <div className="mb-5 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
              <Badge className="bg-primary text-primary-foreground text-xs">Selected</Badge>
              <span className="text-sm font-semibold text-foreground">{selectedService.title}</span>
            </div>
          )}
          <BookingPaymentForm
            onSubmit={handlePaymentSubmit}
            onBack={() => setCurrentStep(2)}
          />
        </div>
      )}
    </div>
  );
};

export default ServicesSection;
