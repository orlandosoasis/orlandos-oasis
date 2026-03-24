import { Check } from "lucide-react";

export interface Addon {
  id: string;
  title: string;
  description: string;
}

export const ADDONS: Addon[] = [
  {
    id: "chemical-testing",
    title: "Chemical Testing & Balancing",
    description: "Maintain safe and balanced water by adjusting chlorine, pH, and alkalinity.",
  },
  {
    id: "filter-cleaning",
    title: "Filter Cleaning / Salt Cell Cleaning & Backwashing",
    description: "Improve filtration and circulation by cleaning the system and removing buildup from the salt cell.",
  },
  {
    id: "equipment-inspection",
    title: "Pool Equipment Inspection",
    description: "Check pumps, motors, valves, and heaters to identify issues early.",
  },
  {
    id: "equipment-repair",
    title: "Pool Equipment Repair",
    description: "Repair or replace malfunctioning pool equipment such as pumps, motors, or lights.",
  },
  {
    id: "algae-treatment",
    title: "Green-to-Clean / Algae Treatment",
    description: "Restore green or algae-filled pools using deep cleaning and chemical treatment.",
  },
  {
    id: "tile-cleaning",
    title: "Tile & Surface Cleaning",
    description: "Remove calcium buildup and stains from tiles and pool surfaces.",
  },
  {
    id: "acid-washing",
    title: "Acid Washing",
    description: "Deep clean surfaces to remove stubborn stains and embedded algae.",
  },
  {
    id: "pool-inspections",
    title: "Pool Inspections",
    description: "Evaluate overall pool condition, including water clarity and equipment performance.",
  },
  {
    id: "pool-startups",
    title: "Pool Startups",
    description: "Prepare newly built or resurfaced pools for use by balancing chemicals and starting equipment.",
  },
];

interface AddonsStepProps {
  selectedAddons: string[];
  onToggleAddon: (id: string) => void;
}

const AddonsStep = ({ selectedAddons, onToggleAddon }: AddonsStepProps) => {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-foreground">Add-ons</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select any additional services you'd like to include.
        </p>
      </div>

      <div className="space-y-3">
        {ADDONS.map((addon) => {
          const isSelected = selectedAddons.includes(addon.id);
          return (
            <button
              key={addon.id}
              type="button"
              onClick={() => onToggleAddon(addon.id)}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground leading-snug">{addon.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{addon.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AddonsStep;
