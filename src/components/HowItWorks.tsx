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
    <section className="bg-card">
      <div className="max-w-[1200px] mx-auto py-20 px-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-navy tracking-tight mb-3">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground/90 max-w-[600px] mx-auto mb-14 md:mb-16">
            Getting your pool serviced has never been easier.<br />Book in under 60 seconds.
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative">
          {/* Connector line (desktop only) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-foreground/10 z-0"
          />

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-14 z-10">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col items-center text-center animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Icon with number badge */}
                <div className="relative mb-4">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(145deg, hsl(203 87% 95%), hsl(203 87% 88%))",
                      boxShadow: "0 8px 24px rgba(13, 125, 194, 0.15)",
                    }}
                  >
                    <step.icon className="h-9 w-9 text-primary" strokeWidth={2} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center ring-4 ring-card">
                    {index + 1}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg md:text-xl font-semibold text-navy mt-4 mb-2">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-[280px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
