import { Star, Calendar, MessageSquare, FlaskConical, Handshake, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import FloatingNav from "@/components/FloatingNav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import BlogStyleHero from "@/components/BlogStyleHero";
import poolWaterBg from "@/assets/pool-water-bg.webp";
import aboutPoolCleaning from "@/assets/about-pool-cleaning.webp";

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
      <FloatingNav />
      <main className="flex-1">

        <BlogStyleHero
          backgroundImage={poolWaterBg}
          overlay="dark"
          title={<>About<br />Orlando's Oasis.</>}
          description="Professional pool maintenance across Tampa, Orlando & Fort Lauderdale, built on consistency, clear communication, and water that stays balanced week after week."
        />

        {/* Who We Are */}
        <section className="py-16 md:py-20 px-4 bg-white">
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
                    <p className="text-sm font-semibold text-navy">Background-checked techs</p>
                    <p className="text-xs font-semibold text-trust">Verified &amp; insured</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="section-title mb-4 text-3xl">
                  Professional pool care<br />across Florida
                </h2>
                <p className="body-text mb-4">
                  Orlando's Oasis provides reliable, consistent pool maintenance for homeowners across Tampa, Orlando, and Fort Lauderdale. We show up on schedule, communicate clearly, and keep your water balanced every single week.
                </p>
                <p className="body-text mb-6">
                  No guesswork. No missed visits. Just clean, clear water you can count on.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 md:py-20 px-4 bg-muted text-center">
          <div className="container max-w-6xl mx-auto">
            <h2 className="section-title max-w-[700px] mx-auto mb-4 text-3xl">
              Dependable pool care that<br />removes stress from pool ownership
            </h2>
            <p className="body-text max-w-[660px] mx-auto mb-12">
              We believe homeowners should enjoy their pools, not worry about chemistry, equipment failure, or missed service. Every visit is guided by that promise.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
              {PILLARS.map((p) => (
                <div key={p.title} className="bg-card transition-colors px-5 py-7 text-center">
                  <p.icon className="h-7 w-7 text-primary mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-navy mb-1">{p.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Talk CTA */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-r from-primary to-oasis-dark text-center text-white">
          <div className="container max-w-6xl mx-auto">
            <h2 className="section-title text-white mb-3 text-3xl">Have questions about your pool?</h2>
            <p className="hero-subtitle text-white max-w-[560px] mx-auto mb-8">
              Speak with a pool professional and get clear, straightforward guidance. No pressure, no sales pitch.
            </p>
            <Button className="h-12 px-6 whitespace-nowrap bg-white text-navy hover:bg-white/90 font-semibold" asChild>
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
