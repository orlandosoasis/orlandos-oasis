import { useState } from "react";
import { z } from "zod";
import { Phone, Mail, MapPin } from "lucide-react";
import FloatingNav from "@/components/FloatingNav";
import BlogStyleHero from "@/components/BlogStyleHero";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import contactHeroBg from "@/assets/contact-hero-bg.webp";

const contactSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().trim().min(1, "Email is required").email("Please enter a valid email address").max(255),
  phone: z.string().trim().max(20).optional(),
  service: z.string().optional(),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

type FormData = z.infer<typeof contactSchema>;

const SERVICE_OPTIONS = [
  "Weekly Pool Service",
  "Chemical Testing & Balancing",
  "Green-to-Clean / Algae Treatment",
  "Equipment Inspection & Repair",
  "Tile & Surface Cleaning",
  "Acid Washing",
  "Pool Inspection",
  "Pool Startup",
  "Other",
];

const CONTACT_INFO = [
  { icon: Phone, label: "Phone", value: "(561) 555-0001" },
  { icon: Mail, label: "Email", value: "hello@orlandosoasis.com" },
  { icon: MapPin, label: "Service Areas", value: "Tampa · Orlando · Fort Lauderdale" },
];

const HOURS = [
  { day: "Mon – Fri", time: "8:00 AM – 6:00 PM" },
  { day: "Saturday", time: "9:30 AM – 4:00 PM" },
  { day: "Sunday", time: "9:30 AM – 4:00 PM" },
];

const CITIES = [
  { name: "Tampa", area: "Tampa Bay Area" },
  { name: "Orlando", area: "Central Florida" },
  { name: "Fort Lauderdale", area: "Broward County" },
];

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible.",
      variant: "success",
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <FloatingNav />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Thank You!</h2>
            <p className="text-muted-foreground">Your message has been sent. We'll get back to you shortly.</p>
            <Button onClick={() => { setIsSubmitted(false); setFormData({ firstName: "", lastName: "", email: "", phone: "", service: "", message: "" }); }}>
              Send Another Message
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <FloatingNav />

      <BlogStyleHero
        backgroundImage={contactHeroBg}
        overlay="dark"
        title={<>Contact Us.</>}
        description="Have a question about pool service, repairs, or want to get started? Send us a message and our team will follow up shortly."
      />

      {/* Contact Section: Info + Form Grid */}
      <section className="py-16 px-5 md:px-10">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-12 md:gap-16 items-start">
          {/* Left: Contact Info */}
          <div>
            <h2 className="text-3xl font-extrabold text-navy mb-2">
              Get in Touch
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-7">
              Have a question about pool service, repairs, or want to get started? Send us a message and our team will follow up shortly during business hours.
            </p>

            {/* Info items */}
            <div className="flex flex-col gap-4 mb-7">
              {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Business Hours */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Business Hours</p>
              <table className="w-full text-sm">
                <tbody>
                  {HOURS.map(({ day, time }) => (
                    <tr key={day} className="border-b border-border last:border-b-0">
                      <td className="py-2 font-semibold text-foreground w-1/2">{day}</td>
                      <td className="py-2 text-muted-foreground">{time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-muted rounded-2xl p-6 md:p-9">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">First Name</label>
                  <Input
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">Last Name</label>
                  <Input
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                  />
                </div>
              </div>

              {/* Email + Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">Mobile Phone</label>
                  <Input
                    type="tel"
                    placeholder="(561) 000-0000"
                    value={formData.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>

              {/* Service select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">Service Interested In</label>
                <select
                  value={formData.service}
                  onChange={(e) => update("service", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring"
                >
                  <option value="">Select a service...</option>
                  {SERVICE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">Message</label>
                <Textarea
                  placeholder="Tell us about your pool and how we can help..."
                  rows={5}
                  value={formData.message}
                  onChange={(e) => update("message", e.target.value)}
                  className={errors.message ? "border-destructive" : ""}
                />
                {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
              </div>

              <Button type="submit" disabled={isSubmitting} className="mt-2">
                {isSubmitting ? "Sending..." : "Submit →"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-16 px-5 md:px-10 bg-card text-center">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="text-3xl font-extrabold text-navy mb-4">
            Serving Pools Across Tampa, Orlando & Fort Lauderdale
          </h2>
          <p className="text-muted-foreground max-w-[700px] mx-auto mb-12 leading-relaxed">
            Orlando's Oasis works with homeowners across Florida's major markets. From weekly maintenance to equipment repairs and green pool recovery, our team provides dependable service across the region.
          </p>

          {/* Map placeholder */}
          <div className="w-full h-[420px] rounded-xl border border-border overflow-hidden bg-gradient-to-b from-[hsl(200,50%,90%)] to-[hsl(200,45%,85%)] flex items-center justify-center relative">
            <svg viewBox="0 0 1200 420" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
              <rect width="1200" height="420" fill="hsl(195,40%,93%)" />
              <line x1="0" y1="70" x2="1200" y2="70" stroke="hsl(195,35%,88%)" strokeWidth="1" />
              <line x1="0" y1="140" x2="1200" y2="140" stroke="hsl(195,35%,88%)" strokeWidth="1" />
              <line x1="0" y1="210" x2="1200" y2="210" stroke="hsl(195,35%,88%)" strokeWidth="1" />
              <line x1="0" y1="280" x2="1200" y2="280" stroke="hsl(195,35%,88%)" strokeWidth="1" />
              <line x1="0" y1="350" x2="1200" y2="350" stroke="hsl(195,35%,88%)" strokeWidth="1" />
              <line x1="200" y1="0" x2="200" y2="420" stroke="hsl(195,35%,88%)" strokeWidth="1" />
              <line x1="400" y1="0" x2="400" y2="420" stroke="hsl(195,35%,88%)" strokeWidth="1" />
              <line x1="600" y1="0" x2="600" y2="420" stroke="hsl(195,35%,88%)" strokeWidth="1" />
              <line x1="800" y1="0" x2="800" y2="420" stroke="hsl(195,35%,88%)" strokeWidth="1" />
              <line x1="1000" y1="0" x2="1000" y2="420" stroke="hsl(195,35%,88%)" strokeWidth="1" />
              <path d="M340,40 L820,40 L850,80 L865,130 L858,180 L850,230 L856,278 L864,326 L862,360 L848,385 L826,400 L800,408 L774,410 L750,406 L728,396 L710,380 L695,358 L678,332 L656,308 L628,288 L596,272 L566,260 L540,252 L514,248 L488,246 L462,248 L440,252 L418,260 L398,272 L380,288 L368,308 L360,326 L356,344 L358,358 L366,368 L360,362 L346,346 L336,324 L330,300 L328,274 L332,248 L330,220 L326,192 L326,164 L330,136 L334,108 L336,80 Z" fill="hsl(100,35%,80%)" stroke="hsl(100,35%,70%)" strokeWidth="1.5" />
              <path d="M420,200 L700,200" stroke="hsl(45,60%,80%)" strokeWidth="3" strokeLinecap="round" />
              <path d="M560,80 L560,360" stroke="hsl(45,60%,80%)" strokeWidth="3" strokeLinecap="round" />
              <path d="M440,130 L820,130" stroke="hsl(45,60%,80%)" strokeWidth="2" strokeDasharray="6,4" />
              {/* Tampa pin */}
              <circle cx="430" cy="270" r="22" fill="hsl(var(--primary) / 0.12)" />
              <circle cx="430" cy="270" r="13" fill="hsl(var(--primary) / 0.2)" />
              <circle cx="430" cy="270" r="9" fill="hsl(var(--primary))" stroke="white" strokeWidth="2.5" />
              <circle cx="430" cy="270" r="3.5" fill="white" />
              <rect x="388" y="288" width="70" height="24" rx="5" fill="white" stroke="hsl(var(--border))" strokeWidth="1" />
              <text x="423" y="304" fontSize="12" fontWeight="700" fill="hsl(var(--foreground))" textAnchor="middle" fontFamily="Manrope,sans-serif">Tampa</text>
              {/* Orlando pin */}
              <circle cx="600" cy="210" r="22" fill="hsl(var(--primary) / 0.12)" />
              <circle cx="600" cy="210" r="13" fill="hsl(var(--primary) / 0.2)" />
              <circle cx="600" cy="210" r="9" fill="hsl(var(--primary))" stroke="white" strokeWidth="2.5" />
              <circle cx="600" cy="210" r="3.5" fill="white" />
              <rect x="558" y="228" width="76" height="24" rx="5" fill="white" stroke="hsl(var(--border))" strokeWidth="1" />
              <text x="596" y="244" fontSize="12" fontWeight="700" fill="hsl(var(--foreground))" textAnchor="middle" fontFamily="Manrope,sans-serif">Orlando</text>
              {/* Fort Lauderdale pin */}
              <circle cx="730" cy="340" r="22" fill="hsl(var(--primary) / 0.12)" />
              <circle cx="730" cy="340" r="13" fill="hsl(var(--primary) / 0.2)" />
              <circle cx="730" cy="340" r="9" fill="hsl(var(--primary))" stroke="white" strokeWidth="2.5" />
              <circle cx="730" cy="340" r="3.5" fill="white" />
              <rect x="674" y="358" width="114" height="24" rx="5" fill="white" stroke="hsl(var(--border))" strokeWidth="1" />
              <text x="731" y="374" fontSize="12" fontWeight="700" fill="hsl(var(--foreground))" textAnchor="middle" fontFamily="Manrope,sans-serif">Fort Lauderdale</text>
              {/* Connector lines */}
              <line x1="430" y1="270" x2="600" y2="210" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.4" />
              <line x1="600" y1="210" x2="730" y2="340" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.4" />
              <text x="570" y="140" fontSize="18" fontWeight="700" fill="hsl(var(--foreground) / 0.1)" textAnchor="middle" fontFamily="Manrope,sans-serif" letterSpacing="4">FLORIDA</text>
            </svg>
          </div>

          {/* City pills */}
          <div className="flex justify-center gap-4 md:gap-8 mt-7 flex-wrap">
            {CITIES.map(({ name, area }) => (
              <div key={name} className="flex items-center gap-2 bg-muted border border-border px-4 py-2.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full bg-trust" />
                <span className="text-sm font-semibold text-foreground">{name}</span>
                <span className="text-xs text-muted-foreground">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
