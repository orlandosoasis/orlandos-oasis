import { useState } from "react";
import { Camera, FileText, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import poolBefore1 from "@/assets/pool-before-1.jpg";
import poolBefore2 from "@/assets/pool-before-2.jpg";
import poolBefore3 from "@/assets/pool-before-3.jpg";
import poolAfter1 from "@/assets/pool-after-1.jpg";
import poolAfter2 from "@/assets/pool-after-2.jpg";
import poolAfter3 from "@/assets/pool-after-3.jpg";

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

const PhotoGrid = ({ photos, label }: { photos: PhotoData[]; label: string }) => {
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoData | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Camera className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <button key={photo.id} onClick={() => setLightboxPhoto(photo)} className="rounded-xl overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
            <div className="relative h-[110px]">
              <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
            </div>
          </button>
        ))}
      </div>
      {lightboxPhoto && (
        <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
            <DialogTitle className="sr-only">Photo</DialogTitle>
            <img src={lightboxPhoto.src} alt={lightboxPhoto.alt} className="w-full max-h-[400px] object-cover" />
            <div className="px-5 py-3 pb-5">
              <p className="text-xs text-muted-foreground">{lightboxPhoto.date} at {lightboxPhoto.time}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

const ServiceReport = () => {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h2 className="text-[17px] font-bold text-foreground mb-4">Service Report</h2>

      <PhotoGrid photos={BEFORE_PHOTOS} label="Before Photos" />
      <div className="border-t border-border my-4" />
      <PhotoGrid photos={AFTER_PHOTOS} label="After Photos" />
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

      {/* Technician Notes */}
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
    </div>
  );
};

export default ServiceReport;
