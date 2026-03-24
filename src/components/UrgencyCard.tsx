import { useState, useEffect } from "react";
import { Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const UrgencyCard = () => {
  const [timeLeft, setTimeLeft] = useState({ minutes: 9, seconds: 55 });
  const [email, setEmail] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email submitted:", email);
  };

  return (
    <div className="bg-card rounded-xl shadow-lg p-6 border border-border">
      {/* Alert Banner */}
      <div className="bg-primary/10 border border-primary rounded-lg p-4 mb-6 text-center">
        <p className="text-sm font-semibold text-navy">
          Limited spots - lock in your savings now.
        </p>
        <p className="text-sm text-navy">
          100% refundable if not used!
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <Tag className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Only</p>
          <p className="font-bold text-navy">7 Intro Deals</p>
          <p className="text-sm text-muted-foreground">Remaining</p>
        </div>
        <div className="text-center">
          <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Time Left</p>
          <p className="font-bold text-navy text-xl animate-countdown">
            {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-navy mb-2">Get Your $49 Pool Cleaning</h3>
        <p className="text-sm text-muted-foreground">
          Professional pool service from Orlando's Oasis (Up to 60% Off)
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 border-2"
          required
        />
        <Button type="submit" className="w-full h-12 text-base font-semibold">
          Get My Discount
        </Button>
      </form>
    </div>
  );
};

export default UrgencyCard;
