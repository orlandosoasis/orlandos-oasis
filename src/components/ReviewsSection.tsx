import { Star } from "lucide-react";
import UrgencyCard from "./UrgencyCard";

const reviews = [
  {
    initials: "PS",
    name: "Paule' S.",
    location: "Oklahoma City, OK",
    time: "about 20 hours ago",
    rating: 5,
    text: "I can't say enough wonderful things about this lady and her cleaning and patience and overall knowledge! She was amazing and can't wait for her to come again! Highly, highly recommend!",
  },
  {
    initials: "BG",
    name: "Brad G.",
    location: "Denver, CO",
    time: "2 days ago",
    rating: 5,
    text: "Absolutely fantastic service! My apartment has never looked this clean. The attention to detail was incredible, from the baseboards to the ceiling fans. Will definitely be booking again!",
  },
  {
    initials: "MR",
    name: "Maria R.",
    location: "Austin, TX",
    time: "3 days ago",
    rating: 5,
    text: "Professional, thorough, and so friendly! She went above and beyond what I expected. My kitchen sparkles now. The $19 intro deal is an absolute steal.",
  },
  {
    initials: "JK",
    name: "James K.",
    location: "Seattle, WA",
    time: "4 days ago",
    rating: 5,
    text: "Best cleaning service I've ever used. They were on time, efficient, and left my home smelling fresh. The booking process was simple and the price was unbeatable.",
  },
];

const ReviewsSection = () => {
  return (
    <section className="py-12 md:py-16 bg-muted/50">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-navy text-center mb-8">
          Verified Customer Reviews
        </h2>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Reviews Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Rating Summary */}
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-4xl font-bold text-navy">4.8</span>
                <div>
                  <div className="flex gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    4,849 Homeaglow ratings
                  </p>
                </div>
                <div className="ml-auto">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-trust">
                    <span className="w-2 h-2 rounded-full bg-trust" />
                    100% Verified Reviews
                  </span>
                </div>
              </div>
            </div>

            {/* Review Cards */}
            {reviews.map((review, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-sm border border-border animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-navy font-semibold shrink-0">
                    {review.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold text-navy">{review.name}</h4>
                      <span className="text-xs text-muted-foreground">{review.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{review.location}</p>
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-navy leading-relaxed">{review.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Urgency Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <UrgencyCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
