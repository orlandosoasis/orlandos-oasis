import { Star, Check, Clock, Sparkles, Wrench, Droplets, FlaskConical, Shield, ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import FloatingNav from "@/components/FloatingNav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import BlogStyleHero from "@/components/BlogStyleHero";
import servicesWeekly from "@/assets/services-weekly.jpg";
import servicesChemistry from "@/assets/services-chemistry.jpg";
import servicesEquipment from "@/assets/services-equipment.jpg";

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
    image: servicesWeekly,
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
  "Skimming surface debris",
  "Brushing walls, steps, and tile line",
  "Vacuuming pool as needed",
  "Emptying skimmer and pump baskets",
  "Water chemistry testing and balancing",
  "Adding necessary chemicals",
  "Filter system check",
  "Equipment inspection",
  "Water level monitoring",
];

const Services = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <FloatingNav />
      <main className="flex-1">

        <BlogStyleHero
          
          title={<>Pool Services That<br />Keep It Crystal Clear.</>}
          description="From weekly maintenance to deep restoration, we handle everything so you can enjoy your pool without the hassle."
        />

        {/* Core Services Overview */}
        <section id="services-overview" className="py-16 md:py-20 px-4 bg-background">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
                Our Services
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Four Categories, One Standard of Care
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every service we offer is built around consistency, clear communication, and properly balanced water.
              </p>
            </div>

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
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <service.icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">{service.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed mb-5">{service.description}</p>
                    <ul className="space-y-2">
                      {service.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
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

        {/* Every Visit Checklist */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-navy to-oasis-navy-light bg-secondary-foreground">
          <div className="container max-w-4xl mx-auto text-center">
            <span className="inline-block bg-oasis-aqua/15 text-oasis-aqua text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
              Every Visit
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              What's Included in Every Service
            </h2>
            <p className="text-white/65 max-w-[560px] mx-auto mb-10">
              Regardless of your service length, every visit covers a comprehensive checklist to keep your pool in top condition.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-left">
              {EVERY_VISIT.map((item) => (
                <div key={item} className="flex items-start gap-2.5 bg-white/[0.06] rounded-lg px-4 py-3">
                  <Check className="h-4 w-4 text-oasis-aqua shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Guide */}
        <section className="py-16 md:py-20 px-4 bg-background">
          <div className="container max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-block bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
                Service Guide
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Choose the Right Service Length
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Use this guide to estimate the right service duration for your pool.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-4 font-semibold text-foreground border-b border-border">Duration</th>
                    <th className="text-left p-4 font-semibold text-foreground border-b border-border">Best for</th>
                    <th className="text-left p-4 font-semibold text-foreground border-b border-border">Typical pool type</th>
                  </tr>
                </thead>
                <tbody>
                  {SERVICE_GUIDE.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-semibold text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        {row.duration}
                      </td>
                      <td className="p-4 text-muted-foreground">{row.bestFor}</td>
                      <td className="p-4 text-muted-foreground">{row.poolType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Extra time:</span> If your pool needs extra time during the first visit, we'll confirm it before continuing. Additional time is billed at a discounted rate for Executive Plan members.
              </p>
            </div>
          </div>
        </section>

        {/* Premium Add-ons */}
        <section className="py-16 md:py-20 px-4 bg-secondary">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
                Premium Add-ons
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Customize Your Service
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Add specialized treatments to any service visit. Available during booking.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ADDONS.map((addon) => (
                <div key={addon.title} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-foreground leading-snug pr-2">{addon.title}</h4>
                    <span className="text-sm font-bold text-primary whitespace-nowrap">{addon.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{addon.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-16 md:py-20 px-4 bg-secondary">
          <div className="container max-w-6xl mx-auto">
            <span className="inline-block bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
              Where We Serve
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Pool Service Areas</h2>
            <p className="text-muted-foreground mb-10 max-w-[580px]">
              Professional pool maintenance across three major Florida markets.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-14 items-start">
              <div className="space-y-3">
                {[
                  { city: "Tampa", desc: "Tampa Bay area & surrounding communities" },
                  { city: "Orlando", desc: "Orlando metro & Central Florida" },
                  { city: "Fort Lauderdale", desc: "Fort Lauderdale & Broward County" },
                ].map((a) => (
                  <div key={a.city} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-3.5 hover:border-primary hover:shadow-md transition-all">
                    <span className="w-2.5 h-2.5 rounded-full bg-trust shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-[15px] font-semibold text-foreground">{a.city}</h4>
                      <p className="text-sm text-muted-foreground">{a.desc}</p>
                    </div>
                    <span className="text-xs font-bold text-trust bg-trust/10 px-2.5 py-1 rounded-full whitespace-nowrap">Live now</span>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground mt-2">
                  Don't see your city?{" "}
                  <Link to="/contact" className="text-primary font-semibold hover:underline">Join the waitlist →</Link>
                </p>
              </div>

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
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready for Crystal Clear Water?</h2>
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

export default Services;
