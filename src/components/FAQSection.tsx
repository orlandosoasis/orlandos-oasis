import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "What is included in weekly pool service?", a: "Weekly service typically includes skimming debris, brushing walls and tile, vacuuming if needed, emptying baskets, checking equipment, and balancing the water chemistry." },
  { q: "How often should my pool be serviced?", a: "Most residential pools should be serviced once per week to maintain clean water, proper chemical balance, and healthy equipment operation." },
  { q: "Do I need to be home during service?", a: "No. As long as we have access to the pool area, service can be completed without the homeowner being present." },
  { q: "What chemicals do you add to the pool?", a: "Common chemicals include chlorine, acid (for pH balance), alkalinity adjusters, and stabilizer depending on the pool's needs." },
  { q: "What happens if my pool turns green?", a: "Green pools usually indicate algae growth. We can perform a green pool cleanup or algae treatment to restore the water back to clear and balanced condition." },
  { q: "Do you check pool equipment during service?", a: "Yes. Pumps, filters, timers, and heaters are visually inspected during service to ensure everything is operating properly." },
  { q: "How long does a pool service visit take?", a: "Most routine pool service visits take 15-30 minutes, depending on pool size, debris level, and required maintenance." },
  { q: "What if my pool has a problem between service visits?", a: "You can contact us anytime and we can schedule a service call or equipment inspection to resolve the issue." },
  { q: "Do you service saltwater pools?", a: "Yes. Saltwater pools still require regular maintenance, including monitoring salt levels, cleaning cells, and balancing water chemistry." },
  { q: "Do you offer one-time cleanings?", a: "Yes. One-time services such as green pool cleanups, filter cleans, or pool startups are available even if you are not on a weekly service plan." },
  { q: "What is a pool startup?", a: "A pool startup is the initial treatment and chemical balancing after a new pool is filled or resurfaced to ensure the water and surfaces cure properly." },
];

const FAQSection = () => {
  return (
    <section className="py-10 md:py-14 lg:py-16 px-4 md:px-6 bg-muted">
      <div className="container max-w-3xl mx-auto">
        <h2 className="font-extrabold text-foreground text-center mb-2 text-4xl">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Everything you need to know about our pool services.
        </p>
        <Accordion type="single" collapsible className="space-y-2">
          {FAQS.map((faq, idx) => (
            <AccordionItem
              key={idx}
              value={`faq-${idx}`}
              className="bg-card border-none rounded-2xl overflow-hidden px-4 shadow-sm"
            >
              <AccordionTrigger className="text-sm font-semibold text-foreground text-left py-4 hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
