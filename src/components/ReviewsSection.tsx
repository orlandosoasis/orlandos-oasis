import { Star } from "lucide-react";

const reviews = [
  {
    initials: "PS",
    name: "Paula S.",
    location: "Orlando, FL",
    time: "about 20 hours ago",
    rating: 5,
    text: "Carlos was amazing! My pool went from green to crystal clear in one visit. He explained everything he did and even gave me tips for maintaining the pH levels. Highly recommend!",
  },
  {
    initials: "BG",
    name: "Brad G.",
    location: "Winter Park, FL",
    time: "2 days ago",
    rating: 5,
    text: "Best pool service in Orlando. The technician arrived on time, was super professional, and my pool has never looked this clean. The chemicals are perfectly balanced now.",
  },
  {
    initials: "MR",
    name: "Maria R.",
    location: "Kissimmee, FL",
    time: "3 days ago",
    rating: 5,
    text: "Professional, thorough, and so friendly! He went above and beyond, even cleaning the pool deck. The $49 intro deal is amazing for the quality of service.",
  },
  {
    initials: "JK",
    name: "James K.",
    location: "Lake Nona, FL",
    time: "4 days ago",
    rating: 5,
    text: "Finally found a reliable pool service! They were on time, efficient, and my water is perfectly clear. The booking app is simple and prices are unbeatable.",
  },
];

const VISIBLE_COUNT = 3;

const ReviewsSection = () => {
  const visibleReviews = reviews.slice(0, VISIBLE_COUNT);

  return (
    <div className="w-full lg:max-w-[420px]">
      <h2 className="text-3xl text-navy mb-3 font-extrabold">
        Verified Customer Reviews
      </h2>

      {/* Inline rating summary */}
      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground mb-8">
        <span className="font-semibold text-navy">4.8</span>
        <span className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-primary text-primary" />
          ))}
        </span>
        <span>·</span>
        <span>2,847 reviews</span>
        <span>·</span>
        <span className="text-trust font-medium">100% verified</span>
      </div>

      {/* Lightweight review list */}
      <ul className="space-y-7">
        {visibleReviews.map((review, index) => (
          <li
            key={index}
            className="flex items-start gap-3 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-navy text-xs font-semibold shrink-0 bg-slate-300">
              {review.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <h4 className="text-navy text-sm font-semibold">
                  {review.name}
                  <span className="text-muted-foreground font-normal ml-1.5">
                    · {review.location}
                  </span>
                </h4>
                <span className="text-muted-foreground text-xs">{review.time}</span>
              </div>
              <div className="flex gap-0.5 mt-1 mb-2">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-[14px] leading-relaxed text-muted-foreground/90">
                {review.text}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {reviews.length > VISIBLE_COUNT && (
        <a
          href="#"
          className="inline-block mt-6 text-sm font-medium text-primary hover:underline"
        >
          View all reviews →
        </a>
      )}
    </div>
  );
};

export default ReviewsSection;
