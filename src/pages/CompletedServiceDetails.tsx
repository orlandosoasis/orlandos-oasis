import { useState } from "react";
import LeaveReviewModal from "@/components/LeaveReviewModal";
import { Link, useNavigate } from "react-router-dom";
import { Waves, ArrowLeft, Clock, Calendar, Star, Droplets, Camera, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { useBooking } from "@/contexts/BookingContext";
import PoolSceneHero from "@/components/dashboard/PoolSceneHero";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import poolBefore1 from "@/assets/pool-before-1.jpg";
import poolBefore2 from "@/assets/pool-before-2.jpg";
import poolBefore3 from "@/assets/pool-before-3.jpg";
import poolAfter1 from "@/assets/pool-after-1.jpg";
import poolAfter2 from "@/assets/pool-after-2.jpg";
import poolAfter3 from "@/assets/pool-after-3.jpg";

const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM",
};

/* Mock service report data for the sample completed service */
const COMPLETED_CHECKLIST = [
  { task: "Surface skimming & debris removal", done: true },
  { task: "Walls & floor brushing", done: true },
  { task: "Vacuum pool floor", done: true },
  { task: "Empty skimmer & pump baskets", done: true },
  { task: "Check & adjust chemical levels", done: true },
  { task: "Backwash / rinse filter", done: true },
  { task: "Inspect equipment for issues", done: true },
  { task: "Tile line scrubbing", done: true },
];

const TECHNICIAN_NOTES = "Skimmer basket was heavily filled with leaves. Adjusted chlorine slightly due to recent rain. Filter pressure normal. Recommend checking again next visit if weather continues.";

interface PhotoData {
  id: string;
  src: string;
  alt: string;
  date: string;
  time: string;
}

const BEFORE_PHOTOS: PhotoData[] = [
  { id: "b1", src: poolBefore1, alt: "Pool surface with leaves and debris", date: "Feb 21, 2026", time: "10:28 AM" },
  { id: "b2", src: poolBefore2, alt: "Pool walls with algae buildup", date: "Feb 21, 2026", time: "10:30 AM" },
  { id: "b3", src: poolBefore3, alt: "Pool with fallen leaves on surface", date: "Feb 21, 2026", time: "10:32 AM" },
];

const AFTER_PHOTOS: PhotoData[] = [
  { id: "a1", src: poolAfter1, alt: "Clean pool with crystal clear water", date: "Feb 21, 2026", time: "11:34 AM" },
  { id: "a2", src: poolAfter2, alt: "Spotless pool tile line and steps", date: "Feb 21, 2026", time: "11:36 AM" },
  { id: "a3", src: poolAfter3, alt: "Pristine pool sparkling in sunlight", date: "Feb 21, 2026", time: "11:38 AM" },
];

const CompletedServiceDetails = () => {
  const navigate = useNavigate();
  const { booking } = useBooking();
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoData | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No completed service found.</p>
        <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  const { selectedPass, scheduleData, technician, frequency } = booking;

  // The completed service happened 5 days before the booking date
  const completedDate = new Date(scheduleData.selectedDate);
  completedDate.setDate(completedDate.getDate() - 5);
  const formattedDate = `${FULL_DAYS[completedDate.getDay()]}, ${SHORT_MONTHS[completedDate.getMonth()]} ${completedDate.getDate()}, ${completedDate.getFullYear()}`;

  const isMonthly = frequency === "monthly";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-[760px] mx-auto px-5 h-[60px] flex items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium text-sm">Back</span>
          </button>
          <Link to="/" className="flex items-center gap-1.5">
            <Waves className="h-5 w-5 text-primary" />
            <span className="text-[1.25rem] font-bold text-foreground tracking-tight">Orlando's Oasis</span>
          </Link>
          <div className="w-[60px]" />
        </div>
      </header>

      {/* Hero — Completed State */}
      <div className="relative h-[200px] overflow-hidden">
        <PoolSceneHero />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-[760px] mx-auto">
          <h1 className="text-xl font-bold text-white">{selectedPass.hours}-Hour Pool Service</h1>
          <p className="text-sm font-semibold text-white/90 mt-1">Completed on {formattedDate}</p>
          <StatusBadge status="completed" className="mt-1.5" />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-[760px] mx-auto px-5 py-6 pb-16 space-y-4">

        {/* Appointment Details + Technician */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Appointment Details */}
          <div className="md:col-span-5 bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col">
            <h2 className="text-[17px] font-bold text-foreground mb-4">Appointment Details</h2>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedPass.hours} {selectedPass.hours === 1 ? "Hour" : "Hours"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span>Completed at 11:42 AM</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span>Monthly plan</span>
              </div>
            </div>
          </div>

          {/* Technician */}
          <div className="md:col-span-7 bg-card rounded-2xl border border-border p-6 shadow-sm flex flex-col">
            <h2 className="text-[17px] font-bold text-foreground mb-4">Your Technician</h2>
            <div className="flex gap-3.5 items-start">
              <div className="w-[56px] h-[56px] rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-lg font-bold shrink-0">
                {technician.isAssigned ? technician.initials : "CM"}
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-foreground">{technician.isAssigned ? technician.name : "Carlos M."}</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-cta-yellow text-cta-yellow" />
                  <span>{technician.isAssigned ? technician.rating : 4.9}</span>
                </div>
                {reviewSubmitted ? (
                  <Button variant="outline" size="sm" className="mt-2 text-xs gap-1.5 rounded-lg opacity-60 cursor-default" disabled>
                    <CheckCircle2 className="h-3 w-3" />
                    Review Submitted
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="mt-2 text-xs gap-1.5 rounded-lg" onClick={(e) => { e.stopPropagation(); setReviewOpen(true); }}>
                    <Star className="h-3 w-3" />
                    Leave a Review
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Service Report */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-4">Service Report</h2>

          {/* Before Photos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Before Photos</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {BEFORE_PHOTOS.map((photo) => (
                <button key={photo.id} onClick={() => setLightboxPhoto(photo)} className="rounded-xl overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
                  <div className="relative h-[110px]">
                    <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border my-4" />

          {/* After Photos */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">After Photos</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {AFTER_PHOTOS.map((photo) => (
                <button key={photo.id} onClick={() => setLightboxPhoto(photo)} className="rounded-xl overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
                  <div className="relative h-[110px]">
                    <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border my-4" />

          {/* Completed Checklist */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Completed Tasks</span>
            </div>
            <div className="space-y-2">
              {COMPLETED_CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{item.task}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Other Notes */}
          {TECHNICIAN_NOTES && (
            <>
              <div className="border-t border-border my-4" />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Other Notes</span>
                </div>
                <div className="bg-muted/50 rounded-xl px-4 py-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{TECHNICIAN_NOTES}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Need more help? */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-[17px] font-bold text-foreground mb-3">Need more help?</h2>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            View our <a href="#" className="text-primary font-semibold hover:underline">help center</a> for more information on what to expect and how Orlando's Oasis works, or <a href="#" className="text-primary font-semibold hover:underline">report an issue</a>.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground mt-10 space-x-3">
          <a href="#" className="text-primary hover:underline">Terms</a>
          <a href="#" className="text-primary hover:underline">Privacy</a>
          <a href="#" className="text-primary hover:underline">Do Not Sell My Personal Information</a>
          <p className="mt-3">© Orlando's Oasis 2015 – 2026</p>
        </footer>
      </main>

      <LeaveReviewModal
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        technicianName={technician.isAssigned ? technician.name : "Carlos M."}
        onSubmit={(rating, message) => {
          setReviewSubmitted(true);
          setReviewOpen(false);
        }}
      />

      {lightboxPhoto && (
        <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
            <DialogTitle className="sr-only">{lightboxPhoto.alt}</DialogTitle>
            <img
              src={lightboxPhoto.src}
              alt={lightboxPhoto.alt}
              className="w-full max-h-[400px] object-cover"
            />
            <div className="px-5 py-3 pb-5">
              <p className="text-sm font-semibold text-foreground">{lightboxPhoto.alt}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Taken on {lightboxPhoto.date} at {lightboxPhoto.time}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default CompletedServiceDetails;
