import { useState } from "react";
import { Camera } from "lucide-react";
import galleryWeekly from "@/assets/gallery-weekly.jpg";
import galleryDeepClean from "@/assets/gallery-deep-clean.jpg";
import galleryResort from "@/assets/gallery-resort.jpg";
import galleryBeforeAfter from "@/assets/gallery-before-after.jpg";
import galleryEvening from "@/assets/gallery-evening.jpg";
import gallerySaltwater from "@/assets/gallery-saltwater.jpg";

const GALLERY_ITEMS = [
  { src: galleryBeforeAfter, label: "Before / After", alt: "Pool transformation before and after deep cleaning" },
  { src: galleryWeekly, label: "Weekly Maintenance", alt: "Crystal clear pool after weekly maintenance service" },
  { src: galleryDeepClean, label: "Deep Clean", alt: "Sparkling pool after professional deep cleaning" },
  { src: galleryResort, label: "Resort Style", alt: "Resort-style residential pool with waterfall feature" },
  { src: galleryEvening, label: "Evening Glow", alt: "Modern pool with LED lighting at dusk" },
  { src: gallerySaltwater, label: "Saltwater Pool", alt: "Infinity edge saltwater pool in Florida neighborhood" },
];

const PoolGallery = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <section className="py-10 md:py-14 lg:py-20 px-4 md:px-6 bg-navy">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 bg-card/10 text-card text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
            <Camera className="h-3.5 w-3.5" />
            Our Results
          </span>
          <h2 className="text-3xl font-extrabold text-card mb-3">
            Real Pools. Real Results.
          </h2>
          <p className="text-card/70 max-w-[560px] mx-auto">
            See the difference professional weekly maintenance makes. Crystal clear water, every time.
          </p>
        </div>

        {/* Bento-style grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {GALLERY_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`group relative overflow-hidden rounded-xl border border-border cursor-pointer focus-visible:border-ring outline-none ${
                i === 0 ? "col-span-2 md:col-span-2 row-span-2" : ""
              }`}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                width={1024}
                height={768}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={GALLERY_ITEMS[selectedIndex].src}
              alt={GALLERY_ITEMS[selectedIndex].alt}
              className="w-full rounded-xl object-contain max-h-[80vh]"
            />

            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm text-foreground w-8 h-8 rounded-full flex items-center justify-center border border-border hover:bg-card transition-colors text-lg"
            >
              ×
            </button>
            {/* Nav arrows */}
            {selectedIndex > 0 && (
              <button
                onClick={() => setSelectedIndex(selectedIndex - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-sm text-foreground w-9 h-9 rounded-full flex items-center justify-center border border-border hover:bg-card transition-colors"
              >
                ‹
              </button>
            )}
            {selectedIndex < GALLERY_ITEMS.length - 1 && (
              <button
                onClick={() => setSelectedIndex(selectedIndex + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-card/90 backdrop-blur-sm text-foreground w-9 h-9 rounded-full flex items-center justify-center border border-border hover:bg-card transition-colors"
              >
                ›
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default PoolGallery;
