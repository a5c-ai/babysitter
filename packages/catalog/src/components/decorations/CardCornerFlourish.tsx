"use client";

interface CardCornerFlourishProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: number;
  className?: string;
}

export function CardCornerFlourish({ position, size = 28, className = "" }: CardCornerFlourishProps) {
  // Determine rotation based on position
  const rotations = {
    "top-left": 0,
    "top-right": 90,
    "bottom-right": 180,
    "bottom-left": 270,
  };

  const positionStyles = {
    "top-left": { top: 2, left: 2 },
    "top-right": { top: 2, right: 2 },
    "bottom-left": { bottom: 2, left: 2 },
    "bottom-right": { bottom: 2, right: 2 },
  };

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        ...positionStyles[position],
        width: size,
        height: size,
        transform: `rotate(${rotations[position]}deg)`,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        style={{
          filter: 'drop-shadow(1px 1px 1px rgba(90, 61, 10, 0.3))',
        }}
      >
        <defs>
          {/* Brass gradient for the flourish */}
          <linearGradient id={`flourishBrass-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="20%" stopColor="#D4A84B" />
            <stop offset="50%" stopColor="#B8860B" />
            <stop offset="80%" stopColor="#8B6914" />
            <stop offset="100%" stopColor="#5A3D0A" />
          </linearGradient>
          {/* Highlight gradient */}
          <linearGradient id={`flourishHighlight-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDE8" />
            <stop offset="50%" stopColor="#FFE066" />
            <stop offset="100%" stopColor="#D4A84B" />
          </linearGradient>
        </defs>

        {/* Main curved flourish - Victorian corner bracket style */}
        <path
          d="M2 2
             C 2 8, 4 12, 8 14
             C 12 16, 16 16, 18 14
             C 16 12, 14 10, 14 8
             C 14 6, 16 4, 18 4
             C 16 2, 12 2, 8 4
             C 4 6, 2 8, 2 2"
          stroke={`url(#flourishBrass-${position})`}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />

        {/* Inner curl accent */}
        <path
          d="M6 6
             C 8 8, 10 10, 12 10
             C 10 8, 8 6, 6 6"
          stroke={`url(#flourishHighlight-${position})`}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Small decorative dot at the corner */}
        <circle
          cx="4"
          cy="4"
          r="2"
          fill={`url(#flourishBrass-${position})`}
          stroke="#5A3D0A"
          strokeWidth="0.5"
        />

        {/* Secondary scroll line */}
        <path
          d="M4 10
             C 6 12, 10 14, 14 14"
          stroke={`url(#flourishBrass-${position})`}
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Tiny accent curl at end */}
        <path
          d="M14 14 C 16 15, 17 14, 16 12"
          stroke={`url(#flourishHighlight-${position})`}
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// Component to add all four corner flourishes to a card
export function CardCornerFlourishes({ size = 28 }: { size?: number }) {
  return (
    <>
      <CardCornerFlourish position="top-left" size={size} />
      <CardCornerFlourish position="top-right" size={size} />
      <CardCornerFlourish position="bottom-left" size={size} />
      <CardCornerFlourish position="bottom-right" size={size} />
    </>
  );
}
