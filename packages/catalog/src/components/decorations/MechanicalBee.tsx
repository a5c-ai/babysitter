"use client";

interface MechanicalBeeProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function MechanicalBee({ size = 64, className = "", style }: MechanicalBeeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={{
        ...style,
        filter: 'drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.4))',
        opacity: 1,
      }}
    >
      <defs>
        {/* Brass body gradient - enhanced with specular highlight */}
        <linearGradient id="mechBeeBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFDE8" />
          <stop offset="8%" stopColor="#FFE857" />
          <stop offset="25%" stopColor="#E5B828" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#B8860B" />
          <stop offset="85%" stopColor="#8B6914" />
          <stop offset="100%" stopColor="#5A3D0A" />
        </linearGradient>

        {/* Copper accent gradient */}
        <linearGradient id="mechBeeCopper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8A065" />
          <stop offset="50%" stopColor="#CD7F32" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>

        {/* Gear wing gradient - enhanced visibility with iridescent cyan hint */}
        <linearGradient id="mechBeeWing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(240, 208, 96, 0.65)" />
          <stop offset="30%" stopColor="rgba(180, 220, 230, 0.3)" />
          <stop offset="50%" stopColor="rgba(212, 175, 55, 0.5)" />
          <stop offset="70%" stopColor="rgba(184, 134, 11, 0.4)" />
          <stop offset="100%" stopColor="rgba(139, 105, 20, 0.3)" />
        </linearGradient>

        {/* Rivet gradient - brighter with specular */}
        <radialGradient id="mechBeeRivet" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFDE8" />
          <stop offset="15%" stopColor="#FFE857" />
          <stop offset="45%" stopColor="#E5B828" />
          <stop offset="100%" stopColor="#6B4E11" />
        </radialGradient>
      </defs>

      {/* Left gear wing - with honeycomb pattern and gear teeth */}
      <g transform="translate(4, 6)">
        {/* Wing outline - gear-shaped */}
        <ellipse cx="5" cy="6" rx="6" ry="8" fill="url(#mechBeeWing)" stroke="#8B6914" strokeWidth="0.8" transform="rotate(-25 5 6)" />
        {/* Subtle wing highlight with iridescent tint */}
        <ellipse cx="4" cy="4" rx="3" ry="4" fill="rgba(180, 220, 230, 0.2)" transform="rotate(-25 4 4)" />
        {/* HONEYCOMB CELLULAR PATTERN - 15 small hexagons with opacity gradient (inner 0.6 to outer 0.85) */}
        {/* Row 1 - top (outermost, opacity 0.85) */}
        <polygon points="2,1.5 3,1 4,1.5 4,2.5 3,3 2,2.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.85" />
        <polygon points="4,1.5 5,1 6,1.5 6,2.5 5,3 4,2.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.85" />
        <polygon points="6,1.5 7,1 8,1.5 8,2.5 7,3 6,2.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.85" />
        {/* Row 2 (opacity 0.78) */}
        <polygon points="1,3 2,2.5 3,3 3,4 2,4.5 1,4" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.78" />
        <polygon points="3,3 4,2.5 5,3 5,4 4,4.5 3,4" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.75" />
        <polygon points="5,3 6,2.5 7,3 7,4 6,4.5 5,4" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.75" />
        <polygon points="7,3 8,2.5 9,3 9,4 8,4.5 7,4" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.78" />
        {/* Row 3 - middle (inner, opacity ~0.68) */}
        <polygon points="2,4.5 3,4 4,4.5 4,5.5 3,6 2,5.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.68" />
        <polygon points="4,4.5 5,4 6,4.5 6,5.5 5,6 4,5.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.6" />
        <polygon points="6,4.5 7,4 8,4.5 8,5.5 7,6 6,5.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.68" />
        {/* Row 4 (opacity 0.72) */}
        <polygon points="1,6 2,5.5 3,6 3,7 2,7.5 1,7" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.72" />
        <polygon points="3,6 4,5.5 5,6 5,7 4,7.5 3,7" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.65" />
        <polygon points="5,6 6,5.5 7,6 7,7 6,7.5 5,7" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.65" />
        <polygon points="7,6 8,5.5 9,6 9,7 8,7.5 7,7" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.72" />
        {/* Wing vein details - main veins */}
        <path d="M5 8 L3 2" stroke="#B8860B" strokeWidth="0.7" fill="none" opacity="0.85" />
        <path d="M5 8 L7 3" stroke="#B8860B" strokeWidth="0.7" fill="none" opacity="0.85" />
        <path d="M5 8 L1 5" stroke="#B8860B" strokeWidth="0.5" fill="none" opacity="0.75" />
        <path d="M5 8 L9 5" stroke="#B8860B" strokeWidth="0.5" fill="none" opacity="0.75" />
        {/* Gear teeth on wing - 8 teeth at r=2.2 */}
        <circle cx="1" cy="3" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="3" cy="0.5" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="6" cy="0" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="9" cy="2" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="10" cy="5" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="9" cy="8" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="1" cy="7" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="-1" cy="5" r="2.2" fill="#B8860B" opacity="0.8" />
        {/* Wing axle */}
        <circle cx="5" cy="8" r="1.8" fill="#8B6914" stroke="#5A3D0A" strokeWidth="0.5" />
      </g>

      {/* Right gear wing - with honeycomb pattern and gear teeth */}
      <g transform="translate(17, 6)">
        <ellipse cx="6" cy="6" rx="6" ry="8" fill="url(#mechBeeWing)" stroke="#8B6914" strokeWidth="0.8" transform="rotate(25 6 6)" />
        {/* Subtle wing highlight with iridescent tint */}
        <ellipse cx="7" cy="4" rx="3" ry="4" fill="rgba(180, 220, 230, 0.2)" transform="rotate(25 7 4)" />
        {/* HONEYCOMB CELLULAR PATTERN - 15 small hexagons with opacity gradient (inner 0.6 to outer 0.85) */}
        {/* Row 1 - top (outermost, opacity 0.85) */}
        <polygon points="3,1.5 4,1 5,1.5 5,2.5 4,3 3,2.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.85" />
        <polygon points="5,1.5 6,1 7,1.5 7,2.5 6,3 5,2.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.85" />
        <polygon points="7,1.5 8,1 9,1.5 9,2.5 8,3 7,2.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.85" />
        {/* Row 2 (opacity 0.78) */}
        <polygon points="2,3 3,2.5 4,3 4,4 3,4.5 2,4" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.78" />
        <polygon points="4,3 5,2.5 6,3 6,4 5,4.5 4,4" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.75" />
        <polygon points="6,3 7,2.5 8,3 8,4 7,4.5 6,4" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.75" />
        <polygon points="8,3 9,2.5 10,3 10,4 9,4.5 8,4" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.78" />
        {/* Row 3 - middle (inner, opacity ~0.68) */}
        <polygon points="3,4.5 4,4 5,4.5 5,5.5 4,6 3,5.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.68" />
        <polygon points="5,4.5 6,4 7,4.5 7,5.5 6,6 5,5.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.6" />
        <polygon points="7,4.5 8,4 9,4.5 9,5.5 8,6 7,5.5" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.68" />
        {/* Row 4 (opacity 0.72) */}
        <polygon points="2,6 3,5.5 4,6 4,7 3,7.5 2,7" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.72" />
        <polygon points="4,6 5,5.5 6,6 6,7 5,7.5 4,7" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.65" />
        <polygon points="6,6 7,5.5 8,6 8,7 7,7.5 6,7" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.65" />
        <polygon points="8,6 9,5.5 10,6 10,7 9,7.5 8,7" fill="none" stroke="#B8860B" strokeWidth="0.3" opacity="0.72" />
        {/* Wing vein details - main veins */}
        <path d="M6 8 L4 2" stroke="#B8860B" strokeWidth="0.7" fill="none" opacity="0.85" />
        <path d="M6 8 L8 3" stroke="#B8860B" strokeWidth="0.7" fill="none" opacity="0.85" />
        <path d="M6 8 L2 5" stroke="#B8860B" strokeWidth="0.5" fill="none" opacity="0.75" />
        <path d="M6 8 L10 5" stroke="#B8860B" strokeWidth="0.5" fill="none" opacity="0.75" />
        {/* Gear teeth on wing - 8 teeth at r=2.2 */}
        <circle cx="2" cy="3" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="5" cy="0.5" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="8" cy="0" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="11" cy="2" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="12" cy="5" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="11" cy="8" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="2" cy="7" r="2.2" fill="#B8860B" opacity="0.8" />
        <circle cx="0" cy="5" r="2.2" fill="#B8860B" opacity="0.8" />
        {/* Wing axle */}
        <circle cx="6" cy="8" r="1.8" fill="#8B6914" stroke="#5A3D0A" strokeWidth="0.5" />
      </g>

      {/* Body - main thorax/abdomen - enhanced outline */}
      <ellipse cx="16" cy="20" rx="5" ry="8" fill="url(#mechBeeBody)" stroke="#1A1A1A" strokeWidth="1.2" />

      {/* ENHANCED yellow/black stripes - classic bee pattern with high contrast */}
      {/* Yellow stripe base */}
      <rect x="11.5" y="13" width="9" height="2.2" fill="#FFD700" rx="0.5" />
      {/* Black stripe */}
      <rect x="11.5" y="15.5" width="9" height="2.5" fill="#1A1A1A" rx="0.5" />
      {/* Yellow stripe */}
      <rect x="11" y="18.2" width="10" height="2.2" fill="#FFD700" rx="0.5" />
      {/* Black stripe */}
      <rect x="11.5" y="20.7" width="9" height="2.5" fill="#1A1A1A" rx="0.5" />
      {/* Yellow stripe */}
      <rect x="11.5" y="23.4" width="9" height="2.2" fill="#FFD700" rx="0.5" />
      {/* Black stripe at tip */}
      <rect x="12" y="25.8" width="8" height="2" fill="#1A1A1A" rx="0.5" />

      {/* Rivets on body - larger and more visible */}
      <circle cx="13" cy="17" r="1" fill="url(#mechBeeRivet)" />
      <circle cx="19" cy="17" r="1" fill="url(#mechBeeRivet)" />
      <circle cx="13" cy="21" r="1" fill="url(#mechBeeRivet)" />
      <circle cx="19" cy="21" r="1" fill="url(#mechBeeRivet)" />
      <circle cx="13" cy="25" r="0.8" fill="url(#mechBeeRivet)" />
      <circle cx="19" cy="25" r="0.8" fill="url(#mechBeeRivet)" />

      {/* Head - enhanced */}
      <circle cx="16" cy="10" r="4" fill="url(#mechBeeBody)" stroke="#4A3508" strokeWidth="0.8" />

      {/* Eyes - mechanical lens style - larger */}
      <circle cx="14" cy="9" r="1.8" fill="#0D0906" stroke="#5A3D0A" strokeWidth="0.5" />
      <circle cx="18" cy="9" r="1.8" fill="#0D0906" stroke="#5A3D0A" strokeWidth="0.5" />
      {/* Eye highlights - copper - more visible */}
      <circle cx="13.3" cy="8.3" r="0.7" fill="#CD7F32" />
      <circle cx="17.3" cy="8.3" r="0.7" fill="#CD7F32" />

      {/* Antennae - thicker */}
      <path d="M14 6 Q12 3 10 2" stroke="#8B6914" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M18 6 Q20 3 22 2" stroke="#8B6914" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      {/* Antenna bulbs - larger */}
      <circle cx="10" cy="2" r="1.5" fill="url(#mechBeeCopper)" stroke="#6B4E11" strokeWidth="0.3" />
      <circle cx="22" cy="2" r="1.5" fill="url(#mechBeeCopper)" stroke="#6B4E11" strokeWidth="0.3" />

      {/* Stinger - enhanced */}
      <path d="M16 28 L16 31" stroke="#8B6914" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14.5 29 L16 31 L17.5 29" stroke="#CD7F32" strokeWidth="1" fill="none" />
    </svg>
  );
}

// Scattered bees component for decoration - 55-60px sizes, fully visible with opacity 1.0
export function ScatteredBees({ count = 8 }: { count?: number }) {
  const beePositions = [
    { x: "10%", y: "18%", rotate: 18, size: 64 },
    { x: "85%", y: "28%", rotate: -28, size: 62 },
    { x: "18%", y: "48%", rotate: 38, size: 68 },
    { x: "90%", y: "62%", rotate: -18, size: 63 },
    { x: "52%", y: "72%", rotate: 12, size: 65 },
    { x: "68%", y: "38%", rotate: -10, size: 62 },
    { x: "32%", y: "82%", rotate: 25, size: 66 },
    { x: "75%", y: "85%", rotate: -22, size: 63 },
    { x: "42%", y: "30%", rotate: 5, size: 62 },
    { x: "58%", y: "55%", rotate: -15, size: 65 },
  ];

  return (
    <>
      {beePositions.slice(0, count).map((pos, i) => (
        <div
          key={i}
          className="absolute pointer-events-none hover:opacity-95 transition-opacity"
          style={{
            left: pos.x,
            top: pos.y,
            transform: `rotate(${pos.rotate}deg)`,
            zIndex: 5,
            opacity: 1,
          }}
        >
          <MechanicalBee size={pos.size} />
        </div>
      ))}
    </>
  );
}
