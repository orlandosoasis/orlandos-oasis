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
    <section
      className="px-4 md:px-6 pt-10 md:pt-14 lg:pt-16 pb-0"
      style={{ background: "hsl(210 60% 12%)" }}
    >
      <div className="container max-w-6xl mx-auto">
        <div className="rounded-3xl bg-primary p-6 md:p-10 lg:p-12 shadow-lg animate-fade-in transition-transform duration-300 hover:-translate-y-0.5">
          {submitted ? (
            <div className="animate-fade-in flex flex-col items-center text-center gap-3 py-4">
              <CheckCircle className="h-12 w-12 text-white" />
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">You're on the list!</h2>
              <p className="text-white/80 max-w-md">
                We'll send pool care tips, seasonal deals, and service updates straight to your inbox.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
              {/* Left: title + description */}
              <div>
                <div className="mb-3">
                  <span className="text-xs uppercase tracking-wider text-white/70 font-semibold">
                    Newsletter
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold !text-white leading-tight mb-2">
                  Stay in the Loop
                </h2>
                <p className="text-white/80 max-w-md">
                  Get pool care tips, exclusive deals, and service updates delivered to your inbox.
                </p>
              </div>

              {/* Right: form */}
              <div>
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      className="h-12 bg-white/20 border-white/30 text-white placeholder:text-white/70 focus:border-white"
                    />
                    {error && (
                      <p className="text-white text-sm mt-1 text-left bg-destructive/80 rounded px-2 py-1 inline-block">
                        {error}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="h-12 px-6 whitespace-nowrap bg-white text-primary hover:bg-white/90 transition-transform duration-200 hover:scale-[1.02]"
                  >
                    Subscribe
                  </Button>
                </form>
                <p className="text-xs text-white/70 mt-3">
                  By subscribing you agree to our{" "}
                  <a href="/privacy" className="underline hover:text-white">
                    Privacy Policy
                  </a>
                  . No spam. Unsubscribe anytime.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
