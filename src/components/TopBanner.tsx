const TopBanner = () => {
  return (
    <div className="py-1.5 text-center border-b border-white/10" style={{ backgroundColor: 'hsl(var(--hp-sky))' }}>
      <p className="font-medium text-sm my-0" style={{ color: 'hsl(var(--hp-navy))' }}>
        Save <span className="font-bold">$25</span> on your first month
      </p>
    </div>
  );
};

export default TopBanner;
