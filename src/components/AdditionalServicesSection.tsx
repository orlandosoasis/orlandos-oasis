import { Wrench, Droplets, Sparkles, FlaskConical, ClipboardCheck, Power } from "lucide-react";

const SERVICES = [
  {
    icon: Wrench,
    title: "Pool Equipment Repair",
    description:
      "Repair or replacement of pumps, motors, lights, and other pool equipment when they malfunction.",
  },
  {
    icon: Droplets,
    title: "Green-to-Clean / Algae Treatment",
    description:
      "Special chemical treatments and deep cleaning to restore pools that have turned green or developed heavy algae.",
  },
  {
    icon: Sparkles,
    title: "Tile & Surface Cleaning",
    description:
      "Removal of calcium buildup, stains, and scaling from the waterline tile and pool surfaces.",
  },
  {
    icon: FlaskConical,
    title: "Acid Washing",
    description:
      "Deep cleaning of pool surfaces to remove stubborn stains, mineral deposits, and embedded algae.",
  },
  {
    icon: ClipboardCheck,
    title: "Pool Inspections",
    description:
      "Full evaluation of water clarity, equipment function, and safety components.",
  },
  {
    icon: Power,
    title: "Pool Startups",
    description:
      "Initial service after a new pool build or resurfacing to balance chemicals, start equipment, and ensure proper curing.",
  },
];

const AdditionalServicesSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-navy mb-3">
            Additional Pool Services
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            On-demand services for deeper cleaning, repairs, and special pool needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-card border border-border/50 rounded-xl p-5 flex flex-col gap-3"
            >
              <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
              <div>
                <h3 className="text-base font-semibold text-foreground/90 mb-1">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdditionalServicesSection;
