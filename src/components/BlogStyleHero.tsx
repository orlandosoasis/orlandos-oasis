interface BlogStyleHeroProps {
  title: React.ReactNode;
  description: string;
  eyebrow?: string;
  backgroundImage?: string;
  /** Visual variant for image overlays. Defaults to "light". */
  overlay?: "light" | "dark";
}

/**
 * Moneda /blog-inspired hero: light background, oversized left-aligned
 * display title, small right-side supporting copy. Sits below the fixed
 * floating pill nav, so we add generous top padding.
 */
const BlogStyleHero = ({
  title,
  description,
  eyebrow,
  backgroundImage,
  overlay = "light",
}: BlogStyleHeroProps) => {
  const isDark = overlay === "dark";

  return (
    <section
      className={`relative ${backgroundImage ? "" : "bg-secondary"}`}
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {backgroundImage && isDark && (
        <>
          <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35"
            aria-hidden="true"
          />
        </>
      )}
      {backgroundImage && !isDark && (
        <div
          className="absolute inset-0 bg-white/55 backdrop-blur-[2px]"
          aria-hidden="true"
        />
      )}
      <div className="relative container max-w-6xl mx-auto px-4 md:px-8 pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
          <div className="lg:col-span-8">
            {eyebrow && (
              <p
                className={`text-xs md:text-sm font-semibold uppercase tracking-[0.18em] mb-4 ${
                  isDark ? "text-white/80" : "text-muted-foreground"
                }`}
              >
                {eyebrow}
              </p>
            )}
            <h1
              className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight ${
                isDark ? "text-white" : "text-foreground"
              }`}
              style={isDark ? { textShadow: "0 2px 24px rgba(0,0,0,0.4)" } : undefined}
            >
              {title}
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p
              className={`text-base md:text-lg leading-relaxed max-w-sm ${
                isDark ? "text-white/95" : "text-foreground/70"
              }`}
              style={isDark ? { textShadow: "0 1px 8px rgba(0,0,0,0.5)" } : undefined}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogStyleHero;
