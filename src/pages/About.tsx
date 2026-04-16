import { Star, Calendar, MessageSquare, FlaskConical, Handshake, CheckCircle2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import aboutHero from "@/assets/about-hero.jpg";

const PILLARS = [
  { icon: Calendar, title: "Consistency", desc: "Same standard, same schedule, every week." },
  { icon: MessageSquare, title: "Transparency", desc: "Clear pricing, no hidden fees, no surprises." },
  { icon: FlaskConical, title: "Expertise", desc: "Proper testing and balancing, not guesswork." },
  { icon: Handshake, title: "Reliability", desc: "Show up, do the work, stand behind it." },
];

const SERVICE_TAGS = ["Tampa", "Orlando", "Fort Lauderdale", "Residential pools", "Saltwater pools", "Spas & hot tubs"];

const AREAS = [
  { city: "Tampa", desc: "Tampa Bay area & surrounding communities" },
  { city: "Orlando", desc: "Orlando metro & Central Florida" },
  { city: "Fort Lauderdale", desc: "Fort Lauderdale & Broward County" },
];

const About = () => {
  const handleScrollToVoucher = () => {
    window.location.href = "/#discount-voucher";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBanner />
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="relative min-h-[400px] md:min-h-[450px] flex items-center">
          <img
            src={aboutHero}
            alt="Professional pool service team working on a residential pool"
            className="absolute inset-0 w-full h-full object-cover object-center"
            width={1920}
            height={800}
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-10 container max-w-6xl mx-auto px-4 md:px-8 py-16">
            <div className="max-w-2xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
                About<br /><span className="text-white">Orlando's Oasis</span>
              </h1>
              <p className="text-base md:text-lg text-white/70 font-light max-w-xl leading-relaxed mb-8">
                Professional pool maintenance across Tampa, Orlando &amp; Fort Lauderdale — built on consistency, clear communication, and water that stays balanced week after week.
              </p>
            </div>
          </div>
        </section>

        {/* Who We Are */}
        <section className="py-16 md:py-20 px-4 bg-background">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&q=80"
                  alt="Crystal clear residential pool"
                  className="w-full aspect-[4/3] object-cover rounded-2xl"
                  loading="lazy"
                />
                {/* Floating badge bottom-left */}
                <div className="absolute -bottom-4 left-6 bg-card rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg border border-border">
                  <div className="w-9 h-9 rounded-lg bg-trust/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-trust" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Background-checked techs</p>
                    <p className="text-xs font-semibold text-trust">Verified &amp; insured</p>
                  </div>
                </div>
                {/* Floating badge top-right */}
                <div className="absolute -top-4 right-6 bg-navy rounded-xl px-4 py-2.5 shadow-lg">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-white">4.8 Rating</p>
                  <p className="text-[11px] text-white/50">2,847 reviews</p>
                </div>
              </div>

              <div>
                <span className="inline-block bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
                  Who We Are
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  Professional pool care across Florida
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Orlando's Oasis provides reliable, consistent pool maintenance for homeowners across Tampa, Orlando, and Fort Lauderdale. We show up on schedule, communicate clearly, and keep your water balanced — every single week.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  No guesswork. No missed visits. Just clean, clear water you can count on.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-navy to-oasis-navy-light text-center">
          <div className="container max-w-6xl mx-auto">
            <span className="inline-block bg-oasis-aqua/15 text-oasis-aqua text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
              Our Mission
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white max-w-[700px] mx-auto mb-4">
              Dependable pool care that removes stress from pool ownership
            </h2>
            <p className="text-white/65 max-w-[660px] mx-auto mb-12 leading-relaxed">
              We believe homeowners should enjoy their pools — not worry about chemistry, equipment failure, or missed service. Every visit is guided by that promise.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10">
              {PILLARS.map((p) => (
                <div key={p.title} className="bg-white/[0.04] hover:bg-white/[0.08] transition-colors px-5 py-7 text-center">
                  <p.icon className="h-7 w-7 text-oasis-aqua mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-white mb-1">{p.title}</h3>
                  <p className="text-[13px] text-white/50 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Talk CTA */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-r from-primary to-oasis-dark text-center text-white">
          <div className="container max-w-6xl mx-auto">
            <span className="inline-block bg-white/15 text-white text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4">
              Talk With Our Team
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Have questions about your pool?</h2>
            <p className="text-white/80 max-w-[560px] mx-auto mb-8 font-light">
              Speak with a pool professional and get clear, straightforward guidance — no pressure, no sales pitch.
            </p>
            <Button variant="secondary" size="lg" className="bg-white text-navy hover:bg-white/90 font-semibold" asChild>
              <Link to="/contact">Contact Us Today</Link>
            </Button>
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
                {AREAS.map((a) => (
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
                  {/* Tampa */}
                  <circle cx="108" cy="228" r="18" fill="rgba(26,111,181,0.08)"/>
                  <circle cx="108" cy="228" r="11" fill="rgba(26,111,181,0.14)"/>
                  <circle cx="108" cy="228" r="7" fill="hsl(203,87%,41%)" stroke="white" strokeWidth="2"/>
                  <circle cx="108" cy="228" r="3" fill="white"/>
                  <rect x="55" y="240" width="56" height="20" rx="4" fill="white" stroke="#dde5ef" strokeWidth="1"/>
                  <text x="83" y="254" fontSize="10" fontWeight="600" fill="#0b2545" textAnchor="middle">Tampa</text>
                  {/* Orlando */}
                  <circle cx="198" cy="198" r="18" fill="rgba(26,111,181,0.08)"/>
                  <circle cx="198" cy="198" r="11" fill="rgba(26,111,181,0.14)"/>
                  <circle cx="198" cy="198" r="7" fill="hsl(203,87%,41%)" stroke="white" strokeWidth="2"/>
                  <circle cx="198" cy="198" r="3" fill="white"/>
                  <rect x="156" y="210" width="60" height="20" rx="4" fill="white" stroke="#dde5ef" strokeWidth="1"/>
                  <text x="186" y="224" fontSize="10" fontWeight="600" fill="#0b2545" textAnchor="middle">Orlando</text>
                  {/* Fort Lauderdale */}
                  <circle cx="238" cy="316" r="18" fill="rgba(26,111,181,0.08)"/>
                  <circle cx="238" cy="316" r="11" fill="rgba(26,111,181,0.14)"/>
                  <circle cx="238" cy="316" r="7" fill="hsl(203,87%,41%)" stroke="white" strokeWidth="2"/>
                  <circle cx="238" cy="316" r="3" fill="white"/>
                  <rect x="185" y="328" width="88" height="20" rx="4" fill="white" stroke="#dde5ef" strokeWidth="1"/>
                  <text x="229" y="342" fontSize="10" fontWeight="600" fill="#0b2545" textAnchor="middle">Fort Lauderdale</text>
                  {/* Connecting lines */}
                  <line x1="108" y1="228" x2="198" y2="198" stroke="hsl(203,87%,41%)" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4"/>
                  <line x1="198" y1="198" x2="238" y2="316" stroke="hsl(203,87%,41%)" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.4"/>
                  <text x="145" y="120" fontSize="13" fontWeight="600" fill="#b2ccd8" textAnchor="middle" opacity="0.7">FLORIDA</text>
                  {/* Legend */}
                  <circle cx="22" cy="398" r="5" fill="hsl(203,87%,41%)" stroke="white" strokeWidth="1.5"/>
                  <text x="32" y="402" fontSize="10" fill="#5e7189">Service area — live now</text>
                </svg>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default About;
