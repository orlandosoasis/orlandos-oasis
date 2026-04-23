import { Link } from "react-router-dom";
import { MapPin, CheckCircle2, ArrowRight, Shield, Clock, Sparkles, Wrench, FlaskConical } from "lucide-react";
import FloatingNav from "@/components/FloatingNav";
import Footer from "@/components/Footer";
import BlogStyleHero from "@/components/BlogStyleHero";
import { Button } from "@/components/ui/button";
import serviceAreasHeroBg from "@/assets/service-areas-hero-bg.webp";

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
          description="Orlando's Oasis provides professional pool maintenance in Tampa, Orlando, and Fort Lauderdale — with plans to expand across the state."
        />

        {/* Areas Detail */}
        <section className="py-16 md:py-20 px-4 bg-background">
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
                        <span className="text-xs font-bold text-trust bg-trust/10 px-2.5 py-1 rounded-full whitespace-nowrap ml-auto md:ml-4">Live now</span>
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
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50" asChild>
                <Link to="/contact">Contact Us</Link>
              </Button>
              <Button variant="secondary" size="lg" className="bg-white text-navy hover:bg-white/90 font-semibold" asChild>
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

export default ServiceAreas;
