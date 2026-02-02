import { Calendar, UserCheck, Waves } from "lucide-react";

const steps = [
  {
    icon: Calendar,
    title: "Book Online",
    description: "Choose your date and time. We'll match you with a certified pool technician in your area.",
  },
  {
    icon: UserCheck,
    title: "Meet Your Tech",
    description: "Your vetted, background-checked pool professional arrives at your home, ready to work.",
  },
  {
    icon: Waves,
    title: "Enjoy Your Pool",
    description: "Dive into crystal-clear water. 100% satisfaction guaranteed on every service.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-12 md:py-20 bg-card">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-navy text-center mb-4">
          How It Works
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Getting your pool serviced has never been easier. Book in under 60 seconds.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-4">
                {index + 1}
              </div>
              <h3 className="text-lg font-semibold text-navy mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
