import { Star } from "lucide-react";

const reviews = [
{
  initials: "PS",
  name: "Paula S.",
  location: "Orlando, FL",
  time: "about 20 hours ago",
  rating: 5,
  text: "Carlos was amazing! My pool went from green to crystal clear in one visit. He explained everything he did and even gave me tips for maintaining the pH levels. Highly recommend!"
},
{
  initials: "BG",
  name: "Brad G.",
  location: "Winter Park, FL",
  time: "2 days ago",
  rating: 5,
  text: "Best pool service in Orlando. The technician arrived on time, was super professional, and my pool has never looked this clean. The chemicals are perfectly balanced now."
},
{
  initials: "MR",
  name: "Maria R.",
  location: "Kissimmee, FL",
  time: "3 days ago",
  rating: 5,
  text: "Professional, thorough, and so friendly! He went above and beyond, even cleaning the pool deck. The $49 intro deal is amazing for the quality of service."
},
{
  initials: "JK",
  name: "James K.",
  location: "Lake Nona, FL",
  time: "4 days ago",
  rating: 5,
  text: "Finally found a reliable pool service! They were on time, efficient, and my water is perfectly clear. The booking app is simple and prices are unbeatable."
}];


const ReviewsSection = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl md:text-3xl font-bold text-navy mb-6">
        Verified Customer Reviews
      </h2>
      
      {/* Rating Summary */}
      <div className="rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-4xl font-bold text-navy">4.8</span>
          <div>
            <div className="flex gap-1 mb-1">
              {[...Array(5)].map((_, i) =>
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              2,847 Orlando's Oasis ratings
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
      {reviews.map((review, index) =>
      <div
        key={index}
        className="rounded-xl p-6 shadow-sm animate-fade-in"
        style={{ animationDelay: `${index * 100}ms` }}>
        
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-navy font-semibold shrink-0">
              {review.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                <h4 className="font-semibold text-navy">{review.name}</h4>
                <span className="text-sm text-navy-light">{review.time}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{review.location}</p>
              <div className="flex gap-0.5 mb-3">
                {[...Array(review.rating)].map((_, i) =>
              <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              )}
              </div>
              <p className="leading-relaxed text-sm text-muted-foreground">{review.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>);

};

export default ReviewsSection;