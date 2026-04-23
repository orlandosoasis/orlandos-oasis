interface BlogStyleHeroProps {
  title: React.ReactNode;
  description: string;
  eyebrow?: string;
}

/**
 * Moneda /blog-inspired hero: light background, oversized left-aligned
 * display title, small right-side supporting copy. Sits below the fixed
 * floating pill nav, so we add generous top padding.
 */
const BlogStyleHero = ({ title, description, eyebrow }: BlogStyleHeroProps) => (
  <section className="bg-secondary">
    <div className="container max-w-6xl mx-auto px-4 md:px-8 pt-32 md:pt-40 pb-16 md:pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
        <div className="lg:col-span-8">
          {eyebrow && (
            <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">
              {eyebrow}
            </p>
          )}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[0.95] tracking-tight text-foreground">
            {title}
          </h1>
        </div>
        <div className="lg:col-span-4">
          <p className="text-base md:text-lg text-foreground/70 leading-relaxed max-w-sm">
            {description}
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default BlogStyleHero;
