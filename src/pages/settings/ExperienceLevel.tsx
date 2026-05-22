import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import BackLink from "@/components/BackLink";

const levels = [
  {
    id: "standard",
    label: "Standard",
    description: "Trained technicians who handle routine pool maintenance and cleaning tasks reliably.",
  },
  {
    id: "experienced",
    label: "Experienced",
    description: "Seasoned professionals with 3+ years. Skilled at troubleshooting equipment and water chemistry.",
  },
  {
    id: "expert",
    label: "Expert",
    description: "Top-tier technicians with advanced certifications. Best for complex pools or premium service.",
  },
];

const ExperienceLevel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState("standard");

  const handleSave = () => {
    toast({ title: "Experience level preference saved.", variant: "success" });
  };

  return (
    <>
      <main className="max-w-[760px] mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Cleaner Experience Level</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Choose your preferred technician experience level. Higher levels may affect pricing or availability.
        </p>

        <div className="space-y-3 max-w-md">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelected(level.id)}
              className={cn(
                "w-full bg-card rounded-2xl border-2 shadow-sm p-5 text-left transition-colors",
                selected === level.id ? "border-primary" : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-[15px] font-semibold text-foreground">{level.label}</p>
                {selected === level.id && (
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{level.description}</p>
            </button>
          ))}

          <Button onClick={handleSave} className="mt-4 w-full">Save Changes</Button>
        </div>
      </main>
    </>
  );
};

export default ExperienceLevel;
