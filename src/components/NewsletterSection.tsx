import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const validate = (value: string) => {
    if (!value.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Please enter a valid email";
    if (value.length > 255) return "Email must be less than 255 characters";
    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(email);
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setSubmitted(true);
    toast({
      title: "You're subscribed!",
      description: "Welcome to the Orlando's Oasis newsletter.",
      variant: "default",
    });
  };

  return (
    <section className="py-10 md:py-14 lg:py-16 px-4 md:px-6 bg-navy">
      <div className="container max-w-2xl mx-auto text-center">
        {submitted ? (
          <div className="animate-fade-in space-y-4">
            <CheckCircle className="h-12 w-12 text-trust mx-auto" />
            <h2 className="text-2xl font-bold text-card">You're on the list!</h2>
            <p className="text-card/70">
              We'll send pool care tips, seasonal deals, and service updates straight to your inbox.
            </p>
          </div>
        ) : (
          <>
            <Mail className="h-10 w-10 text-oasis-aqua mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold mb-2" style={{ color: '#ffffff' }}>
              Stay in the Loop
            </h2>
            <p className="text-card/70 mb-6 max-w-md mx-auto">
              Get pool care tips, exclusive deals, and service updates delivered to your inbox.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  className="h-12 bg-card/10 border-card/20 text-card placeholder:text-card/50 focus:border-oasis-aqua"
                />
                {error && <p className="text-destructive text-sm mt-1 text-left">{error}</p>}
              </div>
              <Button type="submit" className="h-12 px-6 whitespace-nowrap bg-white text-navy hover:bg-white/90">
                Subscribe
              </Button>
            </form>
            <p className="text-xs text-card/50 mt-3">No spam. Unsubscribe anytime.</p>
          </>
        )}
      </div>
    </section>
  );
};

export default NewsletterSection;
