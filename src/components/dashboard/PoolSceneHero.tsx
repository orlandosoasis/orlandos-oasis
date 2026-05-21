import poolCleaningHero from "@/assets/pool-cleaning-hero.jpg";

const PoolSceneHero = () => (
  <div className="relative w-full h-full">
    <img
      src={poolCleaningHero}
      alt="Pool technician cleaning a residential swimming pool"
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
  </div>
);

export default PoolSceneHero;
