import { Star, Calendar, MessageSquare, FlaskConical, Handshake, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import FloatingNav from "@/components/FloatingNav";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/NewsletterSection";
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
                  src={aboutPoolCleaning}
                  alt="Pool technician cleaning a residential pool with a robotic cleaner"
                  className="w-full aspect-[4/3] object-cover rounded-2xl"
                  loading="lazy"
                />
                {/* Floating badge bottom-left */}
                <div className="absolute -bottom-4 left-6 bg-card rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg border border-border">
                  <div className="w-9 h-9 rounded-lg bg-trust/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-trust" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">Background-checked techs</p>
                    <p className="text-xs font-semibold text-trust">Verified &amp; insured</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="section-title mb-4 text-3xl text-card-foreground">
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
            <h2 className="section-title max-w-[700px] mx-auto mb-4 text-3xl text-card-foreground">
              Dependable pool care that<br />removes stress from pool ownership
            </h2>
            <p className="body-text max-w-[660px] mx-auto mb-12">
              We believe homeowners should enjoy their pools, not worry about chemistry, equipment failure, or missed service. Every visit is guided by that promise.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
              {PILLARS.map((p) => (
                <div key={p.title} className="bg-card transition-colors px-5 py-7 text-center">
                  <p.icon className="h-7 w-7 text-primary mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-card-foreground mb-1">{p.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Talk CTA — using newsletter card layout */}
        <section
          className="px-4 md:px-6 pt-10 md:pt-14 lg:pt-16 pb-0"
          style={{ background: "hsl(210 60% 12%)" }}
        >
          <div className="container max-w-6xl mx-auto">
            <div className="rounded-3xl bg-primary p-6 md:p-10 lg:p-12 shadow-lg animate-fade-in transition-transform duration-300 hover:-translate-y-0.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
                <div>
                  <div className="mb-3">
                    <span className="text-xs uppercase tracking-wider text-white/70 font-semibold">
                      Get in touch
                    </span>
                  </div>
                  <h2
                    className="text-3xl md:text-4xl font-extrabold leading-tight mb-2"
                    style={{ color: "#ffffff" }}
                  >
                    Have questions about your pool?
                  </h2>
                  <p className="text-white/80 max-w-md">
                    Speak with a pool professional and get clear, straightforward guidance. No pressure, no sales pitch.
                  </p>
                </div>
                <div className="flex md:justify-end">
                  <Button
                    className="h-12 px-6 whitespace-nowrap bg-white text-primary hover:bg-white/90 font-semibold transition-transform duration-200 hover:scale-[1.02]"
                    asChild
                  >
                    <Link to="/contact#get-in-touch">Contact Us Today</Link>
                  </Button>
                </div>
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
