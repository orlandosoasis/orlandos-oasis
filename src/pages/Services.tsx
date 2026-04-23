import { Star, Check, Clock, Sparkles, Wrench, Droplets, FlaskConical, Shield, ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import FloatingNav from "@/components/FloatingNav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import BlogStyleHero from "@/components/BlogStyleHero";
import servicesWeekly from "@/assets/services-weekly.webp";
import servicesChemistry from "@/assets/services-chemistry.webp";
import servicesEquipment from "@/assets/services-equipment.webp";
import servicesDeepClean from "@/assets/services-deep-clean.webp";
import servicesHeroBg from "@/assets/services-pool-evening.webp";

const CORE_SERVICES = [
  {
    icon: Sparkles,
    title: "Cleaning & Maintenance",
    description: "Routine weekly service to keep your pool sparkling clean and chemically balanced.",
    image: servicesWeekly,
    includes: [
      "Skimming surface debris",
      "Brushing walls, steps, and tile line",
      "Vacuuming pool as needed",
      "Emptying skimmer and pump baskets",
      "Water level monitoring",
    ],
  },
  {
    icon: FlaskConical,
    title: "Chemical Testing & Balancing",
    description: "Precise water chemistry management to ensure safe, clear, and balanced pool water every week.",
    image: servicesChemistry,
    includes: [
      "Water chemistry testing",
      "Chlorine and pH balancing",
      "Alkalinity adjustment",
      "Adding necessary chemicals",
      "Stabilizer monitoring",
    ],
  },
  {
    icon: Wrench,
    title: "Equipment Inspection & Repair",
    description: "Regular checks on pumps, filters, heaters, and valves to catch issues early and keep everything running.",
    image: servicesEquipment,
    includes: [
      "Filter system check",
      "Pump and motor inspection",
      "Heater and valve assessment",
      "Equipment performance report",
      "Minor repair recommendations",
    ],
  },
  {
    icon: Droplets,
    title: "Deep Cleaning & Restoration",
    description: "Intensive treatments for neglected, green, or storm-damaged pools that need a full recovery.",
    image: servicesDeepClean,
    includes: [
      "Green-to-clean algae treatment",
      "Acid washing",
      "Tile and surface cleaning",
      "Heavy debris removal",
      "Full chemical reset",
    ],
  },
];

const SERVICE_GUIDE = [
  { duration: "30 min", bestFor: "Chemical check + quick skim", poolType: "Low-debris / already maintained" },
  { duration: "60 min", bestFor: "Standard weekly service", poolType: "Most residential pools" },
  { duration: "90 min", bestFor: "Deep clean + extra vacuum", poolType: "First-time service or heavy debris" },
  { duration: "120 min", bestFor: "Recovery + reset", poolType: "Neglected, green, or storm aftermath" },
];

const ADDONS = [
  { title: "Chemical Testing & Balancing", price: "$35", desc: "Maintain safe and balanced water by adjusting chlorine, pH, and alkalinity." },
  { title: "Filter / Salt Cell Cleaning", price: "$45", desc: "Improve filtration and circulation by cleaning the system and removing buildup." },
  { title: "Equipment Inspection", price: "$25", desc: "Check pumps, motors, valves, and heaters to identify issues early." },
  { title: "Equipment Repair", price: "$75", desc: "Repair or replace malfunctioning pool equipment such as pumps, motors, or lights." },
  { title: "Green-to-Clean / Algae Treatment", price: "$85", desc: "Restore green or algae-filled pools using deep cleaning and chemical treatment." },
  { title: "Tile & Surface Cleaning", price: "$50", desc: "Remove calcium buildup and stains from tiles and pool surfaces." },
  { title: "Acid Washing", price: "$95", desc: "Deep clean surfaces to remove stubborn stains and embedded algae." },
  { title: "Pool Inspections", price: "$30", desc: "Evaluate overall pool condition, including water clarity and equipment performance." },
  { title: "Pool Startups", price: "$60", desc: "Prepare newly built or resurfaced pools for use by balancing chemicals and starting equipment." },
];

const EVERY_VISIT = [
  "Skimming debris",
  "Brushing walls and tile",
  "Vacuuming if needed",
  "Emptying baskets",
  "Checking equipment",
  "Balancing water chemistry",
];

const Services = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <FloatingNav />
      <main className="flex-1">

        <BlogStyleHero
          backgroundImage={servicesHeroBg}
          overlay="dark"
          title={<>Our Services</>}
          description="From weekly maintenance to deep restoration, we handle everything so you can enjoy your pool without the hassle."
        />

        {/* Core Services Overview */}
        <section id="services-overview" className="py-16 md:py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <div className="space-y-20">
              {CORE_SERVICES.map((service, idx) => (
                <div
                  key={service.title}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${idx % 2 === 1 ? "lg:direction-rtl" : ""}`}
                >
                  <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full aspect-[4/3] object-cover rounded-2xl"
                      loading="lazy"
                      width={800}
                      height={600}
                    />
                  </div>
                  <div className={idx % 2 === 1 ? "lg:order-1" : ""}>
                    <h3 className="font-bold text-3xl text-secondary-foreground mb-4">{service.title}</h3>
                    <p className="body-text mb-5 text-muted-foreground">{service.description}</p>
                    <ul className="space-y-2">
                      {service.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-muted-foreground text-base">
                          <Check className="h-4 w-4 text-trust shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Premium Add-ons */}
        <section className="py-16 md:py-20 px-4 bg-secondary">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="section-title mb-3">
                Customize Your Service
              </h2>
              <p className="body-text max-w-xl mx-auto">
                Add specialized treatments to any service visit. Available during booking.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ADDONS.map((addon) => (
                <div key={addon.title} className="bg-card border border-border rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-navy leading-snug mb-2">{addon.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{addon.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-r from-primary to-oasis-dark text-center text-white">
          <div className="container max-w-6xl mx-auto" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-white" />
              <span className="text-xs font-bold tracking-widest uppercase text-white">100% Satisfaction Guarantee</span>
            </div>
            <h2 className="section-title text-white mb-3">Ready for Crystal Clear Water?</h2>
            <p className="hero-subtitle text-white max-w-[560px] mx-auto mb-8">
              Save $25 on your first month. Book online in under 60 seconds.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="outline" className="h-12 px-6 whitespace-nowrap border-white/30 text-white bg-transparent hover:bg-white hover:!text-navy hover:border-white" asChild>
                <Link to="/contact#get-in-touch">Contact Us</Link>
              </Button>
              <Button className="h-12 px-6 whitespace-nowrap bg-white text-navy hover:bg-white/90" asChild>
                <Link to="/#discount-voucher">
                  Get a Discount Voucher
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Services;
