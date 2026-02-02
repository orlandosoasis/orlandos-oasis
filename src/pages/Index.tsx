import TopBanner from "@/components/TopBanner";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicePassSection from "@/components/ServicePassSection";
import TestimonialCard from "@/components/TestimonialCard";
import ReviewsSection from "@/components/ReviewsSection";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBanner />
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ServicePassSection />
        <TestimonialCard />
        <ReviewsSection />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
