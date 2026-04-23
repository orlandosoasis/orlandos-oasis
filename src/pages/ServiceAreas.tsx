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
            <div className="text-center mb-12">
              <span className="inline-block bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
                Where We Serve
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
                Three Markets. One Standard.
              </h2>
              <p className="text-muted-foreground max-w-[600px] mx-auto">
                Every location receives the same level of care — consistent scheduling, thorough service, and clear communication after every visit.
              </p>
            </div>

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
                          <h3 className="text-lg font-bold text-foreground">{area.city}</h3>
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

        {/* Map + What's Included */}
        <section className="py-16 md:py-20 px-4 bg-secondary">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-14 items-start">
              {/* Florida Map SVG */}
              <div className="bg-card border border-border rounded-2xl p-5 overflow-hidden">
                <svg viewBox="0 0 340 420" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                  <rect width="340" height="420" fill="#ddeef8" rx="12"/>
                  <path d="M82,35 L258,35 L268,48 L273,68 L270,90 L266,112 L268,132 L272,152 L276,172 L277,192 L274,212 L267,228 L260,243 L253,256 L249,268 L247,280 L249,293 L253,306 L255,318 L253,328 L246,337 L234,345 L220,351 L207,355 L196,356 L185,354 L175,349 L168,342 L163,331 L158,319 L151,306 L142,293 L129,281 L115,271 L101,263 L88,257 L75,252 L63,246 L57,236 L59,224 L65,213 L69,201 L71,187 L70,172 L68,157 L65,142 L63,122 L65,102 L68,82 L71,62 L74,45 Z" fill="#e8f5e9" stroke="#b2d8b2" strokeWidth="1"/>
                  <text x="30" y="200" fontSize="9" fill="#7ab8d4" fontStyle="italic" transform="rotate(-90,30,200)">Gulf of Mexico</text>
                  <text x="308" y="160" fontSize="9" fill="#7ab8d4" fontStyle="italic" transform="rotate(90,308,160)">Atlantic Ocean</text>
                  <line x1="0" y1="140" x2="340" y2="140" stroke="#c5dff0" strokeWidth="0.5" strokeDasharray="4,4"/>
                  <line x1="0" y1="240" x2="340" y2="240" stroke="#c5dff0" strokeWidth="0.5" strokeDasharray="4,4"/>
                  <line x1="130" y1="0" x2="130" y2="420" stroke="#c5dff0" strokeWidth="0.5" strokeDasharray="4,4"/>
                  <line x1="220" y1="0" x2="220" y2="420" stroke="#c5dff0" strokeWidth="0.5" strokeDasharray="4,4"/>
                  <circle cx="108" cy="228" r="18" fill="rgba(26,111,181,0.08)"/>
                  <circle cx="108" cy="228" r="11" fill="rgba(26,111,181,0.14)"/>
                  <circle cx="108" cy="228" r="7" fill="hsl(203,87%,41%)" stroke="white" strokeWidth="2"/>
                  <circle cx="108" cy="228" r="3" fill="white"/>
                  <rect x="55" y="240" width="56" height="20" rx="4" fill="white" stroke="#dde5ef" strokeWidth="1"/>
                  <text x="83" y="254" fontSize="10" fontWeight="600" fill="#0b2545" textAnchor="middle">Tampa</text>
                  <circle cx="198" cy="198" r="18" fill="rgba(26,111,181,0.08)"/>
                  <circle cx="198" cy="198" r="11" fill="rgba(26,111,181,0.14)"/>
                  <circle cx="198" cy="198" r="7" fill="hsl(203,87%,41%)" stroke="white" strokeWidth="2"/>
                  <circle cx="198" cy="198" r="3" fill="white"/>
                  <rect x="156" y="210" width="60" height="20" rx="4" fill="white" stroke="#dde5ef" strokeWidth="1"/>
                  <text x="186" y="224" fontSize="10" fontWeight="600" fill="#0b2545" textAnchor="middle">Orlando</text>
                  <circle cx="238" cy="316" r="18" fill="rgba(26,111,181,0.08)"/>
                  <circle cx="238" cy="316" r="11" fill="rgba(26,111,181,0.14)"/>
                  <circle cx="238" cy="316" r="7" fill="hsl(203,87%,41%)" stroke="white" strokeWidth="2"/>
                  <circle cx="238" cy="316" r="3" fill="white"/>
                  <rect x="185" y="328" width="88" height="20" rx="4" fill="white" stroke="#dde5ef" strokeWidth="1"/>
                  <text x="229" y="342" fontSize="10" fontWeight="600" fill="#0b2545" textAnchor="middle">Fort Lauderdale</text>
                  <line x1="108" y1="228" x2="198" y2="198" stroke="hsl(203,87%,41%)" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4"/>
                  <line x1="198" y1="198" x2="238" y2="316" stroke="hsl(203,87%,41%)" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4"/>
                  <text x="145" y="120" fontSize="13" fontWeight="600" fill="#b2ccd8" textAnchor="middle" opacity="0.7">FLORIDA</text>
                  <circle cx="22" cy="398" r="5" fill="hsl(203,87%,41%)" stroke="white" strokeWidth="1.5"/>
                  <text x="32" y="402" fontSize="10" fill="#5e7189">Service area — live now</text>
                </svg>
              </div>

              {/* What's Included */}
              <div>
                <span className="inline-block bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
                  Every Location
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
                  What's included in every market
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  No matter which area you're in, every Orlando's Oasis customer gets the same reliable weekly service.
                </p>
                <div className="space-y-4">
                  {SERVICES_INCLUDED.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 bg-card border border-border rounded-xl px-5 py-4">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{label}</span>
                      <CheckCircle2 className="h-4 w-4 text-trust ml-auto" />
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Expanding Soon</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        We're actively adding new service areas across Florida. Join the waitlist to be the first to know when we arrive in your neighborhood.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-r from-primary to-oasis-dark text-center text-white">
          <div className="container max-w-6xl mx-auto" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-white/80" />
              <span className="text-xs font-bold tracking-widest uppercase text-white/80">100% Satisfaction Guarantee</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Ready for Crystal Clear Water?</h2>
            <p className="text-white/80 max-w-[560px] mx-auto mb-8 font-light">
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
