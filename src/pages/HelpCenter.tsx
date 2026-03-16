import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, CalendarDays, CreditCard, Award, FileText, Settings, ArrowLeftIcon } from "lucide-react";
import oasisLogo from "@/assets/oasis-logo-circle.png";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const CATEGORIES = [
  {
    id: "booking",
    label: "Booking & Scheduling",
    icon: CalendarDays,
    articles: [
      { title: "How do I book a pool cleaning?", body: "Navigate to the dashboard and select 'Book a Service.' Choose your service tier, preferred date, time window, and access method. Complete payment to confirm your appointment." },
      { title: "Can I reschedule my appointment?", body: "Yes. You can reschedule up to 24 hours before your appointment through the dashboard. Late changes may be subject to a fee." },
      { title: "What if I need to cancel?", body: "Cancellations made at least 24 hours in advance are fully refunded. Cancellations within 24 hours may incur a cancellation fee." },
    ],
  },
  {
    id: "billing",
    label: "Billing & Payments",
    icon: CreditCard,
    articles: [
      { title: "What payment methods are accepted?", body: "We accept all major credit and debit cards. Payment is processed securely at the time of booking." },
      { title: "When am I charged for monthly services?", body: "Monthly service subscribers are billed automatically at the beginning of each billing cycle. You can view your billing history on the dashboard." },
      { title: "How do I get a refund?", body: "If you're unsatisfied with a service, contact us within 48 hours. Refunds are issued at Orlando's Oasis's discretion based on the circumstances." },
    ],
  },
  {
    id: "membership",
    label: "Membership & Plans",
    icon: Award,
    articles: [
      { title: "What's included in a monthly service?", body: "Monthly services include one scheduled cleaning per month at a discounted rate. Your service auto-renews unless canceled before the next billing date." },
      { title: "Can I switch between one-time and monthly?", body: "Yes. You can switch to a monthly service at any time from the booking flow. To cancel a monthly service, visit your dashboard settings." },
    ],
  },
  {
    id: "reports",
    label: "Service Reports",
    icon: FileText,
    articles: [
      { title: "Will I receive a service report?", body: "Yes. After every visit, your technician uploads before and after photos along with service notes. These are available on the completed service details page." },
      { title: "What's included in the report?", body: "Reports include photos, cleaning notes, and the date and time the service was completed." },
    ],
  },
  {
    id: "account",
    label: "Account Settings",
    icon: Settings,
    articles: [
      { title: "How do I update my address?", body: "Go to your dashboard and update your pool information. Changes will apply to future bookings." },
      { title: "How do I change my password?", body: "Navigate to Account Settings from your dashboard to update your password." },
    ],
  },
];

const HelpCenter = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const category = CATEGORIES.find((c) => c.id === selectedCategory);

  const filteredCategories = search.trim()
    ? CATEGORIES.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.articles.some((a) => a.title.toLowerCase().includes(search.toLowerCase()))
      )
    : CATEGORIES;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <Link to="/service-details" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5">
            <img src={oasisLogo} alt="Orlando's Oasis" className="h-6 w-6 object-contain" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16">
        <h1 className="text-2xl font-bold text-foreground mb-6">Help Center</h1>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedCategory(null); }}
            className="pl-10"
          />
        </div>

        {!category ? (
          /* Category List */
          <div className="space-y-2">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors text-left"
                >
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-semibold text-foreground flex-1">{cat.label}</span>
                </button>
              );
            })}
            {filteredCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No results found. Try a different search term.</p>
            )}
          </div>
        ) : (
          /* Article List with Accordion */
          <div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1.5 text-sm text-primary font-semibold mb-4 hover:underline"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              All Categories
            </button>
            <h2 className="text-[17px] font-bold text-foreground mb-4">{category.label}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {category.articles.map((article, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="bg-card border border-border rounded-2xl overflow-hidden px-4"
                >
                  <AccordionTrigger className="text-sm font-medium text-foreground text-left py-4 hover:no-underline">
                    {article.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {article.body}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </main>
    </div>
  );
};

export default HelpCenter;
