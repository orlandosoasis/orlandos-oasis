import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import TestimonialCard from "@/components/TestimonialCard";
import ReviewsSection from "@/components/ReviewsSection";
import HowItWorks from "@/components/HowItWorks";
import ServiceDetailsSection from "@/components/ServiceDetailsSection";
import PoolGallery from "@/components/PoolGallery";
import FAQSection from "@/components/FAQSection";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBanner />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <div id="step-indicator-portal" className="container max-w-6xl mx-auto px-4" />
        
        {/* Two-column layout: Reviews left, Pricing right */}
        <section className="py-12 px-4 bg-background">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Reviews - second on mobile, left on desktop */}
              <div className="order-2 lg:order-1">
                <ReviewsSection />
              </div>
              
              {/* Voucher/Services - first on mobile, right on desktop */}
              <div className="order-1 lg:order-2 lg:sticky lg:top-8">
                <ServicesSection />
              </div>
            </div>
          </div>
        </section>
        
        <TestimonialCard />
        <HowItWorks />
        <PoolGallery />
        <ServiceDetailsSection />
        <FAQSection />

        {/* The Fine Print */}
        <section className="py-8 px-4 bg-background">
          <div className="max-w-4xl mx-auto border-t border-border pt-8">
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
