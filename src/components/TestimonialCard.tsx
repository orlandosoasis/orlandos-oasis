import { Star } from "lucide-react";
import poolImage from "@/assets/pool-testimonial.jpg";

const TestimonialCard = () => {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Image */}
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              src={poolImage}
              alt="Crystal clear swimming pool"
              className="w-full h-[300px] md:h-[400px] object-cover"
            />
          </div>
          
          {/* Quote */}
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-primary text-primary" />
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl font-medium text-navy mb-4 leading-relaxed">
              "My pool has never been this clear. The water literally sparkles now!"
            </blockquote>
            <cite className="text-muted-foreground not-italic">
              - Thomas Y, Orlando, FL
            </cite>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialCard;
