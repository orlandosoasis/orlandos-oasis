import { Link } from "react-router-dom";
import {
  Star,
  CheckCircle,
  Calendar,
  Briefcase,
  CreditCard,
  Wrench,
  Truck,
  MessageSquare,
  GraduationCap,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Header from "@/components/Header";
const MinimalHeader = () => <Header minimal />;
import Footer from "@/components/Footer";
import techHero from "@/assets/tech-hero.webp";

const BENEFITS = [
  {
    icon: Calendar,
    title: "Control Your Schedule",
    desc: "Work full-time or part-time. Accept jobs only when you're available and build a routine that fits your life.",
  },
  {
    icon: Briefcase,
    title: "Build Recurring Accounts",
    desc: "Get matched with homeowners who need ongoing weekly or biweekly pool maintenance for steady, predictable work.",
  },
  {
    icon: CreditCard,
    title: "Reliable Weekly Payouts",
    desc: "Track completed jobs and receive secure payouts directly to your account with full earnings visibility.",
  },
];

const EARNINGS = [
  { label: "2-Hour Service", range: "$XX–$XX", sub: "Typical payout per service" },
  { label: "3-Hour Service", range: "$XX–$XX", sub: "Typical payout per service", popular: true },
  { label: "4-Hour Service", range: "$XX–$XX", sub: "Typical payout per service" },
];

const REQUIREMENTS = [
  { icon: GraduationCap, title: "Experience in Pool Maintenance", desc: "Hands-on knowledge of cleaning, chemical balancing, and equipment care." },
  { icon: Wrench, title: "Access to Equipment", desc: "Standard pool service tools, brushes, vacuums, and test kits." },
  { icon: Truck, title: "Reliable Transportation", desc: "A vehicle capable of carrying your equipment between service stops." },
  { icon: MessageSquare, title: "Professional Communication", desc: "Clear, friendly updates and timely responses to homeowners." },
];

const PROCESS = [
  { num: 1, title: "Apply Online", desc: "Submit your profile, credentials, and service area in minutes." },
  { num: 2, title: "Profile Reviewed", desc: "Our team verifies your experience and qualifications." },
  { num: 3, title: "Get Matched", desc: "Receive recurring service routes that fit your schedule." },
  { num: 4, title: "Start Earning", desc: "Complete services and receive reliable weekly payouts." },
];

const TESTIMONIALS = [
  {
    name: "Daniel R.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    quote: "What I value most is the consistency. I've built a reliable weekly route, and I can clearly see my upcoming jobs and earnings.",
  },
  {
    name: "Marcus T.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    quote: "The platform makes it easy to manage my schedule and grow my client base. Weekly payouts are always on time.",
  },
  {
    name: "James L.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    quote: "I started part-time and now have a full route. The recurring accounts give me predictable income every week.",
  },
];

const FAQS = [
  { q: "How do payouts work?", a: "Payouts are processed weekly via direct deposit. You can track your earnings in real-time through your technician dashboard." },
  { q: "Do I need to provide my own chemicals and tools?", a: "Yes, technicians are expected to have access to basic pool service equipment and chemicals. We provide guidance on recommended supplies." },
  { q: "Can I choose which jobs to accept?", a: "Absolutely. You have full control over which jobs you accept based on your availability, location, and preferences." },
  { q: "Are recurring clients guaranteed?", a: "While we can't guarantee specific clients, our matching system prioritizes connecting you with homeowners in your area who need regular service." },
];

const TechnicianLanding = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MinimalHeader />

      <main className="flex-1">
        {/* HERO */}
        <section
          className="relative overflow-hidden"
          style={{
            background:
              "radial-gradient(1200px 600px at 80% 20%, hsl(203 87% 25% / 0.55), transparent 60%), linear-gradient(135deg, #0a1628 0%, #0f2547 60%, #103b6e 100%)",
          }}
        >
          {/* subtle grid */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative container max-w-6xl mx-auto px-4 md:px-8 py-20 md:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left */}
              <div className="text-white">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-semibold tracking-wide text-white/90 border border-white/15 mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Now hiring pool technicians in Central Florida
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.05] tracking-tight" style={{ fontFamily: "'Manrope', sans-serif" }}>
                  Apply to become an <span className="text-[hsl(var(--hp-sky))]">Orlando's Oasis</span> Pool Technician
                </h1>
                <div className="mt-6 space-y-3 max-w-lg">
                  {[
                    "Submit your professional and contact information",
                    "Upload your certifications, licenses, or training credentials",
                    "Provide your resume and relevant work experience",
                    "Our team reviews your application before approval",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-white/85 text-[15px] leading-snug" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link to="/technician/apply">
                    <Button className="rounded-full h-12 px-7 text-base font-semibold bg-white hover:bg-white/90 text-[#0a1628] shadow-lg shadow-black/10" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      Apply as a Pool Technician
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right */}
              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/[0.04] backdrop-blur p-2">
                  <img
                    src={techHero}
                    alt="Pool service professional at work"
                    className="w-full h-[300px] md:h-[360px] object-cover rounded-2xl"
                  />
                  <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 rounded-2xl bg-white/95 backdrop-blur px-4 py-3 flex items-center gap-3 shadow-xl">
                      <div className="h-10 w-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">4.9 Rating</p>
                        <p className="text-xs text-muted-foreground truncate">Avg. technician rating</p>
                      </div>
                    </div>
                    <div className="flex-1 rounded-2xl bg-white/95 backdrop-blur px-4 py-3 flex items-center gap-3 shadow-xl">
                      <div className="h-10 w-10 rounded-full bg-[hsl(var(--hp-ocean))] flex items-center justify-center text-white font-bold shrink-0">
                        $
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground">Weekly payouts</p>
                        <p className="text-xs text-muted-foreground truncate">Direct deposit, every week</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 md:py-[80px] px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-[#111827]">How to Get Started</h2>
              <p className="mt-3 text-base text-muted-foreground">
                Four simple steps from application to your first payout.
              </p>
            </div>

            <div className="relative">
              {/* connector line */}
              <div
                aria-hidden
                className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[hsl(var(--hp-ocean))]/30 via-[hsl(var(--hp-ocean))]/30 to-[hsl(var(--hp-ocean))]/30"
              />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
                {PROCESS.map((s) => (
                  <div key={s.num} className="text-center px-2">
                    <div className="relative z-10 mx-auto h-14 w-14 rounded-full bg-[hsl(var(--hp-ocean))] text-white text-lg font-bold flex items-center justify-center shadow-lg ring-8 ring-white">
                      {s.num}
                    </div>
                    <h3 className="mt-5 font-bold text-[#111827] text-xl">{s.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* WHY JOIN */}
        <section className="py-20 md:py-[80px] px-4 bg-[hsl(210_25%_98%)]">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#111827]">
                Why Pool Professionals Choose Orlando's Oasis
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                We help pool pros grow predictable income with steady demand and recurring service opportunities.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="group p-7 rounded-2xl border border-border bg-white transition hover:shadow-xl hover:-translate-y-1 hover:border-[hsl(var(--hp-ocean))]/30"
                >
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[hsl(var(--hp-ocean))]/10 text-[hsl(var(--hp-ocean))] mb-5">
                    <b.icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-lg font-bold text-[#111827] mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="py-20 md:py-[80px] px-4 bg-white">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#111827]">
                What Pool Pros Are Saying
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Real stories from technicians building recurring routes with us.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="bg-white rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={t.image}
                      alt={t.name}
                      className="h-12 w-12 rounded-full object-cover shrink-0"
                    />
                    <div>
                      <p className="font-semibold text-[#111827]">{t.name}</p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--hp-ocean))] bg-[hsl(var(--hp-ocean))]/10 rounded-full px-2 py-0.5">
                        <CheckCircle className="h-3 w-3" /> Verified Pool Pro
                      </span>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-[15px] leading-relaxed text-foreground/80">
                    "{t.quote}"
                  </blockquote>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* EARNINGS */}
        <section className="py-20 md:py-[80px] px-4 bg-[hsl(210_25%_98%)]">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#111827]">
                How Much Can You Earn?
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Earnings depend on availability and service type. Most technicians build steady weekly income through recurring routes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {EARNINGS.map((e) => {
                const popular = e.popular;
                return (
                  <div
                    key={e.label}
                    className={`relative rounded-2xl p-8 border transition ${
                      popular
                        ? "bg-[hsl(var(--hp-ocean))] text-white border-[hsl(var(--hp-ocean))] shadow-2xl md:scale-105 md:py-10"
                        : "bg-white border-border hover:shadow-lg"
                    }`}
                  >
                    {popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#0a1628] text-xs font-bold px-3 py-1 rounded-full shadow">
                        Most Popular
                      </span>
                    )}
                    <h3 className={`text-lg font-bold mb-3 ${popular ? "text-white" : "text-[#111827]"}`}>
                      {e.label}
                    </h3>
                    <p className={`text-4xl font-extrabold mb-2 ${popular ? "text-white" : "text-[hsl(var(--hp-ocean))]"}`}>
                      {e.range}
                    </p>
                    <p className={`text-sm ${popular ? "text-white/80" : "text-muted-foreground"}`}>
                      {e.sub}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-6 text-center italic">
              Add-ons such as filter cleaning, tile scrubbing, algae treatment, and acid washes may increase earnings.
            </p>
          </div>
        </section>

        {/* REQUIREMENTS */}
        <section className="py-20 md:py-[80px] px-4 bg-white">
          <div className="container max-w-5xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-[#111827]">
                Requirements to Join
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {REQUIREMENTS.map((r) => (
                <div
                  key={r.title}
                  className="flex gap-4 p-6 rounded-2xl bg-white border border-border hover:shadow-md transition"
                >
                  <div className="shrink-0 inline-flex items-center justify-center h-11 w-11 rounded-xl bg-[hsl(var(--hp-ocean))]/10 text-[hsl(var(--hp-ocean))]">
                    <r.icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111827] mb-1 text-xl">{r.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-8">
              We'll guide you through every step of onboarding.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section
          className="faq-section py-20 md:py-[80px] px-4"
          style={{ background: "linear-gradient(135deg, #0D7DC2 0%, #1453a8 60%, #0a3d8f 100%)" }}
        >
          <div className="container max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-extrabold text-white tracking-tight text-4xl md:text-5xl" style={{ fontFamily: "'Manrope', sans-serif" }}>
                Pool Pro FAQ
              </h2>
            </div>
            <Accordion type="single" collapsible className="space-y-4">
              {FAQS.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-0 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 px-5"
                >
                  <AccordionTrigger className="text-white hover:no-underline text-left py-4 text-base font-semibold" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/85 pb-5 text-[15px] leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

      </main>

      {/* Minimal footer */}
      <footer className="py-6 px-6" style={{ background: "#0a1628", fontFamily: "'Manrope', sans-serif" }}>
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-6 text-sm text-white/85">
            <span className="font-semibold">Orlando's Oasis</span>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <span className="text-sm text-white/70">© 2026 Orlando's Oasis. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default TechnicianLanding;
