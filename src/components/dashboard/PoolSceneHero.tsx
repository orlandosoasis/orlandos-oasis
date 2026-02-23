const PoolSceneHero = () => (
  <svg
    className="w-full h-full"
    viewBox="0 0 760 190"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#AEE6F5" />
        <stop offset="100%" stopColor="#D9F4FF" />
      </linearGradient>
      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0096C7" stopOpacity="0.85" />
        <stop offset="100%" stopColor="#023E8A" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="deckGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F5EFE6" />
        <stop offset="100%" stopColor="#E8DDD0" />
      </linearGradient>
    </defs>
    <rect width="760" height="190" fill="url(#skyGrad)" />
    <circle cx="680" cy="35" r="28" fill="#FFD166" opacity="0.9" />
    <circle cx="680" cy="35" r="22" fill="#FFE082" />
    <ellipse cx="120" cy="30" rx="50" ry="18" fill="white" opacity="0.7" />
    <ellipse cx="150" cy="22" rx="35" ry="16" fill="white" opacity="0.7" />
    <ellipse cx="90" cy="25" rx="30" ry="13" fill="white" opacity="0.6" />
    <ellipse cx="420" cy="40" rx="40" ry="14" fill="white" opacity="0.5" />
    <rect x="0" y="130" width="760" height="60" fill="url(#deckGrad)" />
    <line x1="0" y1="145" x2="760" y2="145" stroke="#D4C5B2" strokeWidth="1" opacity="0.6" />
    <line x1="0" y1="160" x2="760" y2="160" stroke="#D4C5B2" strokeWidth="1" opacity="0.6" />
    <rect x="60" y="90" width="550" height="70" rx="6" fill="url(#waterGrad)" />
    <path d="M80 105 Q140 100 200 108 Q260 116 320 104 Q380 92 440 107 Q500 122 560 105" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
    <path d="M80 120 Q150 115 220 122 Q290 129 360 116 Q430 103 500 119 Q540 128 580 115" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" />
    <rect x="60" y="88" width="550" height="5" rx="3" fill="white" opacity="0.5" />
    <line x1="200" y1="93" x2="200" y2="158" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="6,6" />
    <line x1="370" y1="93" x2="370" y2="158" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="6,6" />
    <line x1="540" y1="93" x2="540" y2="158" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="6,6" />
    <rect x="570" y="95" width="4" height="55" rx="2" fill="rgba(255,255,255,0.6)" />
    <rect x="580" y="95" width="4" height="55" rx="2" fill="rgba(255,255,255,0.6)" />
    <rect x="568" y="110" width="18" height="3" rx="1" fill="rgba(255,255,255,0.7)" />
    <rect x="568" y="125" width="18" height="3" rx="1" fill="rgba(255,255,255,0.7)" />
    <rect x="568" y="140" width="18" height="3" rx="1" fill="rgba(255,255,255,0.7)" />
    <rect x="640" y="135" width="55" height="18" rx="4" fill="#E0D0BA" />
    <rect x="690" y="128" width="8" height="20" rx="3" fill="#D4C0A6" />
    <rect x="645" y="152" width="10" height="5" rx="2" fill="#C4B090" />
    <rect x="680" y="152" width="10" height="5" rx="2" fill="#C4B090" />
    <line x1="665" y1="100" x2="665" y2="155" stroke="#8B7355" strokeWidth="2.5" />
    <path d="M630 101 Q665 82 700 101" fill="hsl(0 84% 60%)" opacity="0.85" />
    <path d="M630 101 Q647 110 665 101" fill="hsl(0 84% 65%)" opacity="0.7" />
    <path d="M665 101 Q682 110 700 101" fill="hsl(0 84% 55%)" opacity="0.75" />
    <rect x="18" y="75" width="8" height="70" rx="4" fill="#8B7355" />
    <ellipse cx="22" cy="70" rx="28" ry="14" fill="#2ECC71" opacity="0.85" />
    <ellipse cx="8" cy="78" rx="20" ry="9" fill="#27AE60" opacity="0.8" />
    <ellipse cx="38" cy="76" rx="20" ry="9" fill="#27AE60" opacity="0.75" />
    <ellipse cx="300" cy="130" rx="22" ry="10" fill="#FFD166" opacity="0.9" />
    <ellipse cx="300" cy="127" rx="18" ry="7" fill="#FFE082" />
  </svg>
);

export default PoolSceneHero;
