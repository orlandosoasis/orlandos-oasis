import { useState } from "react";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface LeaveReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicianName: string;
  onSubmit: (rating: number, message: string) => void;
}

const LeaveReviewModal = ({ open, onOpenChange, technicianName, onSubmit }: LeaveReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    onSubmit(rating, message.trim());
    setRating(0);
    setHoveredStar(0);
    setMessage("");
    setError("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setRating(0);
    setHoveredStar(0);
    setMessage("");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <div className="space-y-5">
          {/* Header */}
          <div>
            <DialogTitle className="text-lg font-bold text-foreground">Leave a Review</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">How was your service with {technicianName}?</p>
          </div>

          {/* Rating */}
          <div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hoveredStar || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => { setRating(star); setError(""); }}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${filled ? "fill-cta-yellow text-cta-yellow" : "text-muted-foreground/30"}`}
                    />
                  </button>
                );
              })}
            </div>
            {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
          </div>

          {/* Message */}
          <div>
            <Textarea
              placeholder="Share your experience (optional)"
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= 500) setMessage(e.target.value);
              }}
              className="resize-none rounded-xl min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{message.length}/500</p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>Submit Review</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveReviewModal;
