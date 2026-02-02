import { useState } from "react";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import heroImage from "@/assets/hero-cleaners.jpg";

const HeroSection = () => {
  const [zipcode, setZipcode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle zipcode submission
    console.log("Checking zipcode:", zipcode);
  };

  return (
    <section className="relative bg-card">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="relative min-h-[500px] md:min-h-[550px] rounded-xl overflow-hidden">
          {/* Background Image */}
          <img
            src={heroImage}
            alt="Professional pool technician at work"
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
          
          {/* Overlay for mobile readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/40 via-transparent to-transparent md:hidden" />
          
          {/* Form Card */}
          <div className="relative flex items-center justify-end h-full min-h-[500px] md:min-h-[550px] p-4 md:p-8">
            <div className="w-full md:w-[420px] bg-card rounded-xl shadow-2xl p-6 md:p-8 animate-fade-in">
              <h1 className="text-2xl md:text-3xl font-bold text-navy leading-tight mb-4">
                Crystal Clear Pools, Zero Hassle—See If We're in Your Area!
              </h1>
              
              <p className="text-muted-foreground mb-6">
                Enter your zip code to see available pool cleaning services near you!
              </p>
              
              <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
                <Input
                  type="text"
                  placeholder="Zipcode"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  className="flex-1 h-12 text-base border-2 border-muted focus:border-primary"
                  maxLength={5}
                />
                <Button 
                  type="submit" 
                  className="h-12 px-8 text-base font-semibold"
                >
                  Go
                </Button>
              </form>
              
              {/* Trust Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-navy">Excellent</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-oasis text-oasis" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  <span className="font-medium text-navy">2,847</span> reviews
                </span>
              </div>

              {/* Login CTA */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Already a member?
                </p>
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full h-11 font-semibold">
                    Log In to Your Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
