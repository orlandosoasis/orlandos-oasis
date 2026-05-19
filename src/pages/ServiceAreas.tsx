import { Link } from "react-router-dom";
import { MapPin, CheckCircle2, ArrowRight, Shield, Clock, Sparkles, Wrench, FlaskConical } from "lucide-react";
import FloatingNav from "@/components/FloatingNav";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsletterSection";
import BlogStyleHero from "@/components/BlogStyleHero";
import { Button } from "@/components/ui/button";
import serviceAreasHeroBg from "@/assets/service-areas-pool-steps.webp";

const AREAS = [
  {
    city: "Tampa",
    region: "Tampa Bay Area",
    desc: "Serving homeowners across Tampa, St. Petersburg, Clearwater, and surrounding communities in Hillsborough and Pinellas counties.",
    neighborhoods: ["South Tampa", "Westchase", "New Tampa", "Riverview", "Brandon", "Carrollwood"],
  },
  {
    city: "Orlando",
    region: "Central Florida",
    desc: "Professional pool care throughout the Orlando metro, including Winter Park, Lake Nona, and surrounding Orange and Seminole county communities.",
    neighborhoods: ["Winter Park", "Lake Nona", "Dr. Phillips", "Windermere", "Oviedo", "Altamonte Springs"],
  },
  {
    city: "Fort Lauderdale",
    region: "Broward County",
    desc: "Reliable weekly service across Fort Lauderdale, Plantation, Coral Springs, and the greater Broward County area.",
    neighborhoods: ["Plantation", "Coral Springs", "Weston", "Davie", "Pembroke Pines", "Hollywood"],
  },
];

const SERVICES_INCLUDED = [
  { icon: Sparkles, label: "Weekly Cleaning & Skimming" },
  { icon: FlaskConical, label: "Chemical Testing & Balancing" },
  { icon: Wrench, label: "Equipment Inspection" },
  { icon: Shield, label: "Service Reports After Every Visit" },
];

const ServiceAreas = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <FloatingNav />
      <main className="flex-1">

        <BlogStyleHero
          backgroundImage={serviceAreasHeroBg}
          overlay="dark"
          title={<>Service Areas</>}
          description="Orlando's Oasis provides professional pool maintenance in Tampa, Orlando, and Fort Lauderdale, with plans to expand across the state."
        />

        {/* Areas Detail */}
        <section className="py-16 md:py-20 px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <div className="space-y-6">
              {AREAS.map((area) => (
                <div key={area.city} className="bg-card border border-border rounded-2xl p-6 md:p-8 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-navy">{area.city}</h3>
                          <p className="text-xs font-semibold text-primary">{area.region}</p>
                        </div>
                        
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{area.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {area.neighborhoods.map((n) => (
                          <span key={n} className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — using newsletter card layout (matches Services page) */}
        <section
          className="px-4 md:px-6 pt-10 md:pt-14 lg:pt-16 pb-0"
          style={{ background: "hsl(210 60% 12%)" }}
        >
          <div className="container max-w-6xl mx-auto">
            <div className="rounded-3xl bg-primary p-6 md:p-10 lg:p-12 shadow-lg animate-fade-in transition-transform duration-300 hover:-translate-y-0.5 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-white" />
                <span className="text-xs font-bold tracking-widest uppercase text-white">
                  100% Satisfaction Guarantee
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3 text-white">
                Ready for Crystal Clear Water?
              </h2>
              <p className="text-white/80 max-w-[560px] mx-auto mb-8">
                Save $25 on your first month. Book online in under 60 seconds.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  variant="outline"
                  className="h-12 px-6 whitespace-nowrap border-white/30 text-white bg-transparent hover:bg-white hover:!text-primary hover:border-white"
                  asChild
                >
                  <Link to="/contact#get-in-touch">Contact Us</Link>
                </Button>
                <Button
                  className="h-12 px-6 whitespace-nowrap bg-white text-primary hover:bg-white/90 font-semibold transition-transform duration-200 hover:scale-[1.02]"
                  asChild
                >
                  <Link to="/#discount-voucher">
                    Get a Discount Voucher
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default ServiceAreas;
