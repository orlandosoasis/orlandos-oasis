import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, CalendarDays, CreditCard, Award, FileText, Settings, HelpCircle } from "lucide-react";
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
  {
    id: "faq",
    label: "FAQs",
    icon: HelpCircle,
    articles: [
      { title: "What is included in weekly pool service?", body: "Weekly service typically includes skimming debris, brushing walls and tile, vacuuming if needed, emptying baskets, checking equipment, and balancing the water chemistry." },
      { title: "How often should my pool be serviced?", body: "Most residential pools should be serviced once per week to maintain clean water, proper chemical balance, and healthy equipment operation." },
      { title: "Do I need to be home during service?", body: "No. As long as we have access to the pool area, service can be completed without the homeowner being present." },
      { title: "What chemicals do you add to the pool?", body: "Common chemicals include chlorine, acid (for pH balance), alkalinity adjusters, and stabilizer depending on the pool's needs." },
      { title: "What happens if my pool turns green?", body: "Green pools usually indicate algae growth. We can perform a green pool cleanup or algae treatment to restore the water back to clear and balanced condition." },
      { title: "Do you check pool equipment during service?", body: "Yes. Pumps, filters, timers, and heaters are visually inspected during service to ensure everything is operating properly." },
      { title: "How long does a pool service visit take?", body: "Most routine pool service visits take 15-30 minutes, depending on pool size, debris level, and required maintenance." },
      { title: "What if my pool has a problem between service visits?", body: "You can contact us anytime and we can schedule a service call or equipment inspection to resolve the issue." },
      { title: "Do you service saltwater pools?", body: "Yes. Saltwater pools still require regular maintenance, including monitoring salt levels, cleaning cells, and balancing water chemistry." },
      { title: "Do you offer one-time cleanings?", body: "Yes. One-time services such as green pool cleanups, filter cleans, or pool startups are available even if you are not on a weekly service plan." },
      { title: "What is a pool startup?", body: "A pool startup is the initial treatment and chemical balancing after a new pool is filled or resurfaced to ensure the water and surfaces cure properly." },
    ],
  },
];

const HelpCenter = () => {
  const [search, setSearch] = useState("");

  const filteredCategories = search.trim()
    ? CATEGORIES.filter(
        (c) =>
          c.label.toLowerCase().includes(search.toLowerCase()) ||
          c.articles.some((a) => a.title.toLowerCase().includes(search.toLowerCase()))
      )
    : CATEGORIES;

  return (
    <>

      <main className="max-w-[760px] mx-auto px-5 py-8 pb-16">
        <h1 className="text-2xl font-bold text-foreground mb-6">Help Center</h1>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Full Accordion Layout */}
        <Accordion type="single" collapsible className="space-y-2">
          {filteredCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <AccordionItem
                key={cat.id}
                value={cat.id}
                className="bg-card border border-border rounded-2xl overflow-hidden px-4"
              >
                <AccordionTrigger className="text-sm font-semibold text-foreground text-left py-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary shrink-0" />
                    <span>{cat.label}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <Accordion type="single" collapsible className="space-y-1.5">
                    {cat.articles
                      .filter((a) =>
                        !search.trim() || a.title.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((article, idx) => (
                        <AccordionItem
                          key={idx}
                          value={`${cat.id}-${idx}`}
                          className="border border-border rounded-xl overflow-hidden px-3 bg-muted/30"
                        >
                          <AccordionTrigger className="text-sm font-medium text-foreground text-left py-3 hover:no-underline">
                            {article.title}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-3">
                            {article.body}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {filteredCategories.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No results found. Try a different search term.</p>
        )}
      </main>
    </>
  );
};

export default HelpCenter;
