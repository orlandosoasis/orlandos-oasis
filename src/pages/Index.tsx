import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import TestimonialCard from "@/components/TestimonialCard";
import ReviewsSection from "@/components/ReviewsSection";
import HowItWorks from "@/components/HowItWorks";
import WhatsIncludedSection from "@/components/WhatsIncludedSection";
import AdditionalServicesSection from "@/components/AdditionalServicesSection";
import ServiceDetailsSection from "@/components/ServiceDetailsSection";
import PoolGallery from "@/components/PoolGallery";
import FAQSection from "@/components/FAQSection";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="hp-theme min-h-screen flex flex-col">
      <main className="flex-1">
        <HeroSection />
        <TopBanner />
        <div id="step-indicator-portal" className="container max-w-6xl mx-auto px-4 md:px-6" />
        
        {/* Two-column layout: Reviews left, Pricing right */}
        <section className="py-10 md:py-14 lg:py-16 px-4 md:px-6 bg-white">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:h-[min(820px,calc(100vh-8rem))]">
              {/* Reviews - second on mobile, left on desktop. Scrolls independently on desktop. */}
              <div className="order-2 lg:order-1 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-2 lg:[scrollbar-width:thin] lg:[scrollbar-color:hsl(var(--border))_transparent] lg:[&::-webkit-scrollbar]:w-1.5 lg:[&::-webkit-scrollbar-track]:bg-transparent lg:[&::-webkit-scrollbar-thumb]:bg-border lg:[&::-webkit-scrollbar-thumb]:rounded-full">
                <ReviewsSection />
              </div>

              {/* Voucher/Services - bordered card on desktop with scrollable body and pinned CTA */}
              <div className="order-1 lg:order-2 lg:h-full lg:min-h-0 lg:rounded-lg lg:border-0 lg:bg-card lg:text-card-foreground lg:shadow-sm lg:flex lg:flex-col lg:overflow-hidden">
                <div
                  className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:p-6 lg:[scrollbar-width:thin] lg:[scrollbar-color:hsl(var(--border))_transparent] lg:[&::-webkit-scrollbar]:w-1.5 lg:[&::-webkit-scrollbar-track]:bg-transparent lg:[&::-webkit-scrollbar-thumb]:bg-border lg:[&::-webkit-scrollbar-thumb]:rounded-full bg-slate-50"
                >
                  <ServicesSection />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <PoolGallery />
        <HowItWorks />
        <WhatsIncludedSection />
        <AdditionalServicesSection />
        <ServiceDetailsSection />
        <FAQSection />

        {/* The Fine Print */}
        <section className="py-10 md:py-14 lg:py-16 px-4 md:px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <h4 className="text-lg font-semibold text-foreground mb-4 text-center">
              The Fine Print
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground max-w-2xl mx-auto">
              {[
                "Offer valid for new customers.",
                "Online booking required.",
                "Reschedule/cancel policy: 6-hour notice.",
                "Service Pass expires after 12 months if unused.",
                "Executive Plan discounts apply while membership is active.",
                "Cancel any time. If cancelled before 6 paid months, the initial discounted month may be adjusted to standard pricing.",
              ].map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        </section>
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
