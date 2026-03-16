import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

const ServicesSection = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div id="discount-voucher" className="scroll-mt-8">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Get Professional Pool Service
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Complete cleaning, maintenance, and repair services for residential pools and spas.
        </p>
      </div>

      <RadioGroup
        value={selected || ""}
        onValueChange={setSelected}
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
        onClick={() => navigate("/service-pass")}
        className="w-full h-14 text-[17px] font-bold rounded-full shadow-md hover:shadow-lg mt-6"
      >
        Book Your Pool Service
      </Button>
    </div>
  );
};

export default ServicesSection;
