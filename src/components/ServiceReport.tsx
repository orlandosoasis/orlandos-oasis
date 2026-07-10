import { useState } from "react";
import { Camera, FileText, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useServicePhotos, type ServicePhoto } from "@/hooks/useServicePhotos";
import poolBefore1 from "@/assets/pool-before-1.jpg";
import poolBefore2 from "@/assets/pool-before-2.jpg";
import poolBefore3 from "@/assets/pool-before-3.jpg";
import poolAfter1 from "@/assets/pool-after-1.jpg";
import poolAfter2 from "@/assets/pool-after-2.jpg";
import poolAfter3 from "@/assets/pool-after-3.jpg";

const DEMO_BEFORE = [
  { id: "b1", src: poolBefore1, alt: "Pool surface with leaves and debris" },
  { id: "b2", src: poolBefore2, alt: "Pool walls with algae buildup" },
  { id: "b3", src: poolBefore3, alt: "Pool with fallen leaves on surface" },
];

const DEMO_AFTER = [
  { id: "a1", src: poolAfter1, alt: "Clean pool with crystal clear water" },
  { id: "a2", src: poolAfter2, alt: "Spotless pool tile line and steps" },
  { id: "a3", src: poolAfter3, alt: "Pristine pool sparkling in sunlight" },
];

const DEMO_CHECKLIST = [
  "Surface skimming & debris removal",
  "Walls & floor brushing",
  "Vacuum pool floor",
  "Empty skimmer & pump baskets",
  "Check & adjust chemical levels",
  "Backwash / rinse filter",
  "Inspect equipment for issues",
  "Tile line scrubbing",
];

const DEMO_NOTES =
  "Skimmer basket was heavily filled with leaves. Adjusted chlorine slightly due to recent rain. Filter pressure normal. Recommend checking again next visit if weather continues.";

interface PhotoItem {
  id: string;
  src: string;
  alt: string;
}

const PhotoGrid = ({ photos, label }: { photos: PhotoItem[]; label: string }) => {
  const [lightbox, setLightbox] = useState<PhotoItem | null>(null);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Camera className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No photos uploaded.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo)}
              className="rounded-xl overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
            >
              <div className="relative h-[110px]">
                <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover" loading="lazy" />
              </div>
            </button>
          ))}
        </div>
      )}
      {lightbox && (
        <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl">
            <DialogTitle className="sr-only">Photo</DialogTitle>
            <img src={lightbox.src} alt={lightbox.alt} className="w-full max-h-[400px] object-cover" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface ServiceReportProps {
  serviceId?: string;
  completedTasks?: string[];
  techNotes?: string | null;
}

const ServiceReport = ({ serviceId, completedTasks, techNotes }: ServiceReportProps) => {
  const { data: photos = [] } = useServicePhotos(serviceId);

  const hasRealPhotos = photos.length > 0;

  const beforePhotos: PhotoItem[] = hasRealPhotos
    ? photos.filter((p) => p.type === "before").map((p) => ({ id: p.id, src: p.url, alt: "Pool before service" }))
    : DEMO_BEFORE;

  const afterPhotos: PhotoItem[] = hasRealPhotos
    ? photos.filter((p) => p.type === "after").map((p) => ({ id: p.id, src: p.url, alt: "Pool after service" }))
    : DEMO_AFTER;

  const tasks = completedTasks && completedTasks.length > 0 ? completedTasks : DEMO_CHECKLIST;
  const notes = techNotes ?? DEMO_NOTES;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h2 className="text-[17px] font-bold text-foreground mb-4">Service Report</h2>

      <PhotoGrid photos={beforePhotos} label="Before Photos" />
      <div className="border-t border-border my-4" />
      <PhotoGrid photos={afterPhotos} label="After Photos" />
      <div className="border-t border-border my-4" />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Completed Tasks</span>
        </div>
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm text-foreground">{task}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border my-4" />
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Other Notes</span>
        </div>
        <div className="bg-muted/50 rounded-xl px-4 py-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{notes}</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceReport;
