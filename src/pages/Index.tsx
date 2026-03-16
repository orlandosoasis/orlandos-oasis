import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import TestimonialCard from "@/components/TestimonialCard";
import ReviewsSection from "@/components/ReviewsSection";
import HowItWorks from "@/components/HowItWorks";
import ServiceDetailsSection from "@/components/ServiceDetailsSection";
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
              {/* Left: Service Pass Pricing (first on mobile too) */}
              <div className="lg:sticky lg:top-8">
                <ServicesSection />
              </div>
              
              {/* Right: Reviews */}
              <div>
                <ReviewsSection />
              </div>
            </div>
          </div>
        </section>
        
        <TestimonialCard />
        <HowItWorks />
        <ServiceDetailsSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
