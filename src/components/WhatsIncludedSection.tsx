import { Waves, Brush, Droplet, Trash2, FlaskConical, FlaskRound, Filter, Wrench, Gauge } from "lucide-react";
import poolImage from "@/assets/gallery-resort.jpg";

const ITEMS = [
  { icon: Waves, label: "Skimming surface debris" },
  { icon: Brush, label: "Brushing walls & tile" },
  { icon: Droplet, label: "Vacuuming pool" },
  { icon: Trash2, label: "Emptying baskets" },
  { icon: FlaskConical, label: "Water chemistry testing" },
  { icon: FlaskRound, label: "Adding chemicals" },
  { icon: Filter, label: "Filter system check" },
  { icon: Wrench, label: "Equipment inspection" },
];

const WhatsIncludedSection = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          {/* Left column */}
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold text-navy mb-3">
              What's Included – Every Visit
            </h2>
            <p className="text-muted-foreground mb-8 text-base">
              Our weekly service keeps your pool clean, balanced, and ready to use. We take care of the maintenance so you don't have to.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {ITEMS.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-4 py-3"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <span className="text-sm text-foreground/80 font-normal">{label}</span>
                </div>
              ))}
            </div>

            {/* Highlight card */}
            <div className="bg-primary/5 border-l-4 border-primary rounded-lg p-4 flex items-start gap-3 mt-auto">
              <Gauge className="h-5 w-5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <p className="font-semibold text-navy text-sm mb-1">Water Level Monitoring</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Ensure the pool maintains the proper level for optimal circulation and equipment performance.
                </p>
              </div>
            </div>
          </div>

          {/* Right column - image */}
          <div className="order-first lg:order-last">
            <div className="relative h-full min-h-[320px] lg:min-h-full rounded-2xl overflow-hidden shadow-lg">
              <img
                src={poolImage}
                alt="Sparkling clean residential pool maintained by Orlando's Oasis"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsIncludedSection;
