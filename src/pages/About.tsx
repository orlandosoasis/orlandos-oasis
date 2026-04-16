import { Star, Calendar, MessageSquare, FlaskConical, Handshake, CheckCircle2 } from "lucide-react";
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
              <p className="text-base md:text-lg max-w-xl leading-relaxed mb-8 font-normal text-primary-foreground">
                Professional pool maintenance across Tampa, Orlando &amp; Fort Lauderdale, built on consistency, clear communication, and water that stays balanced week after week.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/20 rounded-xl overflow-hidden border border-white/20">
              {PILLARS.map((p) => (
                <div key={p.title} className="bg-card transition-colors px-5 py-7 text-center">
                  <p.icon className="h-7 w-7 text-primary mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-foreground mb-1">{p.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{p.desc}</p>
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

      </main>
      <Footer />
    </div>
  );
};

export default About;
