import { Link } from "react-router-dom";
import { Star, CheckCircle, Calendar, DollarSign, Briefcase, ClipboardList, CreditCard, ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import logo from "@/assets/oo-logo.png";
import techHero from "@/assets/tech-hero.webp";

const BENEFITS = [
  { icon: Calendar, title: "Control Your Schedule", desc: "Work full-time or part-time. Accept jobs only when you're available and build a routine that fits your life." },
  { icon: Briefcase, title: "Build Recurring Accounts", desc: "Get matched with homeowners who need ongoing weekly or biweekly pool maintenance, giving you steady and predictable work." },
  { icon: CreditCard, title: "Reliable Weekly Payouts", desc: "Track completed jobs and receive secure payouts directly to your account with full earnings visibility." },
];

const STEPS = [
  { num: 1, icon: ClipboardList, title: "Register", desc: "Create your profile and set your service area." },
  { num: 2, icon: Calendar, title: "Set Availability", desc: "Choose when and how often you want to accept jobs." },
  { num: 3, icon: Briefcase, title: "Accept Pool Jobs", desc: "Receive service details matching your area and schedule." },
  { num: 4, icon: CheckCircle, title: "Complete Service", desc: "Perform cleaning, report findings, and mark it complete." },
  { num: 5, icon: DollarSign, title: "Get Paid", desc: "Receive weekly payouts with full earnings visibility." },
];

const EARNINGS = [
  { label: "2-Hour Service", range: "$XX–$XX", sub: "Typical payout per service" },
  { label: "3-Hour Service", range: "$XX–$XX", sub: "Typical payout per service", popular: true },
  { label: "4-Hour Service", range: "$XX–$XX", sub: "Typical payout per service" },
];

const REQUIREMENTS = [
  "Experience in pool maintenance or cleaning",
  "Access to basic pool service equipment",
  "Reliable transportation",
  "Professional communication",
];

const TESTIMONIALS = [
  {
    name: "Daniel R.",
    meta: "Verified Pool Pro",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    quote: "What I value most is the consistency. I've built a reliable weekly route, and I can clearly see my upcoming jobs and earnings.",
    badge: "Verified Pool Pro · 112 Services Completed",
  },
  {
    name: "Marcus T.",
    meta: "Verified Pool Pro",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    quote: "The platform makes it easy to manage my schedule and grow my client base. Weekly payouts are always on time.",
    badge: "Verified Pool Pro · 87 Services Completed",
  },
  {
    name: "James L.",
    meta: "Verified Pool Pro",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    quote: "I started part-time and now have a full route. The recurring accounts give me predictable income every week.",
    badge: "Verified Pool Pro · 156 Services Completed",
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
      {/* Header */}
      <header className="bg-card py-4 px-4 md:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Orlando's Oasis" className="h-8 w-8 object-contain" />
            <span className="text-xl font-bold text-navy">Orlando's Oasis</span>
          </Link>
          <Link to="/login" className="text-sm font-semibold text-navy hover:text-primary transition-colors">
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-card">
          <div className="container max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                
                <h1 className="text-5xl font-extrabold text-navy leading-tight mb-4 md:text-4xl">
                  Apply to become an Orlando's Oasis Pool Technician
                </h1>
                <p className="text-muted-foreground mb-6">
                  Submit your application to join the Orlando's Oasis technician network. Provide your experience, certifications, and resume so our team can review your qualifications and approve you to service homeowners in your area.
                </p>
                <ul className="space-y-2 mb-6">
                  {["Submit your professional and contact information", "Upload your certifications, licenses, or training credentials", "Provide your resume and relevant work experience", "Our team reviews your application before approval"].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle className="h-4 w-4 text-trust mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="max-w-sm">
                  <Link to="/technician/apply">
                    <Button className="w-full h-12 text-base font-semibold">
                      Apply as a Pool Technician
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <img src={techHero} alt="Pool service professional" className="rounded-xl w-full max-w-md mx-auto shadow-lg" />
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-4 bg-primary/10">
          <div className="container max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-navy">4.8</span>
              <div className="flex">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-oasis text-oasis" />)}</div>
              <span className="text-sm text-muted-foreground">based on technician reviews</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-trust" /> Secure payouts</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-trust" /> Flexible scheduling</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-trust" /> Fast onboarding</span>
            </div>
          </div>
        </section>

        {/* Why Join */}
        <section className="py-16 px-4 bg-white">
          <div className="container max-w-6xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy mb-2">Why Pool Technicians Join Orlando's Oasis</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto">We help pool professionals grow predictable income with steady demand and recurring service opportunities.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {BENEFITS.map((b) => (
                <div key={b.title} className="p-6 text-center flex flex-col items-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-md mb-4">
                    <b.icon className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-navy mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6 bg-white">
          <div className="container max-w-[1200px] mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-navy text-center mb-12 leading-tight">
              What Pool Pros Are Saying
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  className="bg-white rounded-2xl p-6 border border-border shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img src={t.image} alt={t.name} className="h-14 w-14 rounded-xl object-cover shrink-0" />
                    <div>
                      <p className="font-semibold text-navy text-base">{t.name}</p>
                      <p className="text-sm text-muted-foreground">{t.meta}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
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


        {/* Earnings */}
        <section className="py-16 px-4 bg-card">
          <div className="container max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy mb-2">How Much Can You Earn?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Earnings depend on availability, service type, and recurring accounts. Many pool pros build steady weekly income through consistent routes.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {EARNINGS.map((e) => (
                <div key={e.label} className={`rounded-xl p-6 border ${e.popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'} bg-background relative`}>
                  {e.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>}
                  <h3 className="font-bold text-navy mb-2">{e.label}</h3>
                  <p className="text-2xl font-extrabold text-primary mb-1">{e.range}</p>
                  <p className="text-xs text-muted-foreground">{e.sub}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 italic">Add-ons such as filter cleaning, tile scrubbing, algae treatment, and acid washes may increase earnings.</p>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-16 px-4 bg-background">
          <div className="container max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-navy mb-8">Requirements to Join</h2>
            <ul className="space-y-4 text-left">
              {REQUIREMENTS.map((r) => (
                <li key={r} className="flex items-center gap-3 pb-4 border-b border-border last:border-0">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-foreground">{r}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-6">We'll guide you through the onboarding process step by step.</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq-section py-16 px-4 bg-gradient-to-br from-navy via-oasis-navy-light to-primary">
          <div className="container max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-card text-center mb-8">Pool Pro FAQ</h2>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-navy-light/50 border border-card/10 rounded-lg px-4">
                  <AccordionTrigger className="text-card hover:no-underline">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-card/70">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="py-8" style={{ backgroundColor: "hsl(215 100% 12%)" }}>
        <div className="container max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm text-card/70">
            <Link to="/" className="hover:text-card transition-colors">Orlando's Oasis</Link>
            <Link to="/privacy" className="hover:text-card transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-card transition-colors">Terms</Link>
          </div>
          <span className="text-sm text-card/70 shrink-0">© 2026 Orlando's Oasis. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default TechnicianLanding;
