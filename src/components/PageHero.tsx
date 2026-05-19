interface PageHeroProps {
  imageSrc: string;
  imageAlt: string;
  title: React.ReactNode;
  description: string;
  flipImage?: boolean;
}

const PageHero = ({ imageSrc, imageAlt, title, description, flipImage }: PageHeroProps) => (
  <section className="relative min-h-[400px] md:min-h-[450px] flex items-center">
    <img
      src={imageSrc}
      alt={imageAlt}
      className="absolute inset-0 w-full h-full object-cover object-center"
      style={flipImage ? { transform: 'scaleX(-1)' } : undefined}
      width={1920}
      height={800}
    />
    <div className="absolute inset-0 bg-black/45" />
    <div className="relative z-10 container max-w-6xl mx-auto px-4 md:px-8 py-16">
      <div className="max-w-2xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5">
          {title}
        </h1>
        <p
          className="text-base md:text-lg max-w-xl leading-relaxed font-normal text-white/95"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
        >
          {description}
        </p>
      </div>
    </div>
  </section>
);

export default PageHero;
