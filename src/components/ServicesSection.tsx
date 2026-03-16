import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SERVICES = [
  {
    title: "Weekly Pool / Spa Cleaning",
    description: "Regular service that includes skimming debris, brushing walls, vacuuming the pool or spa, and emptying baskets to keep the water clean and clear.",
  },
  {
    title: "Chemical Testing & Balancing",
    description: "Technicians test and adjust chlorine, pH, alkalinity, and other chemicals to keep pool water safe and properly balanced.",
  },
  {
    title: "Filter Cleaning / Salt Cell Cleaning / Backwashing",
    description: "Cleaning the filtration system and salt cell to maintain proper circulation and chlorine generation.",
  },
  {
    title: "Pool Equipment Inspection",
    description: "Inspection of pumps, motors, valves, and heaters to identify potential issues early.",
  },
  {
    title: "Pool Equipment Repair",
    description: "Repair or replacement of pumps, motors, lights, and other pool equipment when needed.",
  },
  {
    title: "Green-to-Clean / Algae Treatment",
    description: "Deep cleaning and chemical treatment to restore pools affected by algae or green water.",
  },
  {
    title: "Tile & Surface Cleaning",
    description: "Removal of calcium buildup and stains from waterline tile and pool surfaces.",
  },
  {
    title: "Acid Washing",
    description: "Deep surface cleaning to remove stains, mineral buildup, and embedded algae.",
  },
  {
    title: "Pool Inspections",
    description: "Evaluation of pool condition including water clarity, equipment performance, and safety components.",
  },
  {
    title: "Pool Startups",
    description: "Initial service after a new pool build or resurfacing to balance chemicals and start equipment.",
  },
];

const ServicesSection = () => {
  const navigate = useNavigate();

  return (
    <div id="discount-voucher" className="scroll-mt-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Get Professional Pool Service
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Complete cleaning, maintenance, and repair services for residential pools and spas.
        </p>
      </div>

      <div className="space-y-3">
        {SERVICES.map((service, idx) => (
          <div
            key={idx}
            className="bg-card border border-border rounded-xl p-4 transition-colors hover:border-primary/50"
          >
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {service.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {service.description}
            </p>
          </div>
        ))}
      </div>

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
