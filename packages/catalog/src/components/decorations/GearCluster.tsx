"use client";

interface GearClusterProps {
  position: "left" | "right";
  className?: string;
}

// Generate gear teeth path
function generateGearPath(cx: number, cy: number, innerRadius: number, outerRadius: number, teeth: number): string {
  const points: string[] = [];
  const angleStep = (Math.PI * 2) / (teeth * 2);

  for (let i = 0; i < teeth * 2; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`);
  }

  return points.join(' ') + ' Z';
}

export function GearCluster({ position, className = "" }: GearClusterProps) {
  const isLeft = position === "left";

  return (
    <div
      className={`absolute ${isLeft ? "-left-6" : "-right-6"} -top-4 ${className}`}
      style={{ width: "100px", height: "100px" }}
    >
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        className="animate-spin-slow"
        style={{
          animationDuration: "25s",
          transform: isLeft ? "none" : "scaleX(-1)",
        }}
      >
        <defs>
          {/* Large gear gradient - brass - more metallic depth */}
          <linearGradient id={`largeGearGrad-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8C252" />
            <stop offset="20%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#B8860B" />
            <stop offset="80%" stopColor="#8B6914" />
            <stop offset="100%" stopColor="#5A3D0A" />
          </linearGradient>

          {/* Medium gear gradient - copper - richer */}
          <linearGradient id={`medGearGrad-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0B878" />
            <stop offset="25%" stopColor="#E8A065" />
            <stop offset="50%" stopColor="#CD7F32" />
            <stop offset="75%" stopColor="#A66628" />
            <stop offset="100%" stopColor="#8B4513" />
          </linearGradient>

          {/* Small gear gradient - dark brass - enhanced */}
          <linearGradient id={`smallGearGrad-${position}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="30%" stopColor="#C9A227" />
            <stop offset="60%" stopColor="#A67C00" />
            <stop offset="100%" stopColor="#6B4E11" />
          </linearGradient>
        </defs>

        {/* LARGE gear (back) - 90px scale - 16 teeth for more detail */}
        <g className="gear-large" style={{ transformOrigin: "45px 55px" }}>
          <path
            d={generateGearPath(45, 55, 28, 38, 16)}
            fill={`url(#largeGearGrad-${position})`}
            stroke="#5A3D0A"
            strokeWidth="2"
          />
          {/* Inner circle with detail */}
          <circle cx="45" cy="55" r="20" fill="#3D2B1F" stroke="#8B6914" strokeWidth="3" />
          {/* Center hole */}
          <circle cx="45" cy="55" r="6" fill="#1a1a1a" />
          {/* Spokes - 4 way */}
          <line x1="45" y1="38" x2="45" y2="72" stroke="#6B4E11" strokeWidth="4" />
          <line x1="28" y1="55" x2="62" y2="55" stroke="#6B4E11" strokeWidth="4" />
          <line x1="33" y1="43" x2="57" y2="67" stroke="#6B4E11" strokeWidth="3" />
          <line x1="57" y1="43" x2="33" y2="67" stroke="#6B4E11" strokeWidth="3" />
          {/* Center rivet */}
          <circle cx="45" cy="55" r="3" fill="#D4AF37" />
        </g>

        {/* MEDIUM gear (middle) - counter-rotating - 10 teeth */}
        <g className="gear-medium" style={{ transformOrigin: "72px 35px" }}>
          <path
            d={generateGearPath(72, 35, 15, 22, 10)}
            fill={`url(#medGearGrad-${position})`}
            stroke="#8B4513"
            strokeWidth="1.5"
          />
          <circle cx="72" cy="35" r="10" fill="#3D2B1F" stroke="#CD7F32" strokeWidth="2" />
          <circle cx="72" cy="35" r="3" fill="#1a1a1a" />
          <circle cx="72" cy="35" r="1.5" fill="#CD7F32" />
        </g>

        {/* SMALL gear (front) - 8 teeth */}
        <g className="gear-small" style={{ transformOrigin: "25px 25px" }}>
          <path
            d={generateGearPath(25, 25, 10, 15, 8)}
            fill={`url(#smallGearGrad-${position})`}
            stroke="#6B4E11"
            strokeWidth="1"
          />
          <circle cx="25" cy="25" r="6" fill="#3D2B1F" stroke="#A67C00" strokeWidth="1.5" />
          <circle cx="25" cy="25" r="2" fill="#1a1a1a" />
          <circle cx="25" cy="25" r="1" fill="#C9A227" />
        </g>

        {/* Extra tiny accent gear */}
        <g className="gear-tiny" style={{ transformOrigin: "82px 70px" }}>
          <path
            d={generateGearPath(82, 70, 6, 9, 6)}
            fill={`url(#smallGearGrad-${position})`}
            stroke="#5A3D0A"
            strokeWidth="0.75"
          />
          <circle cx="82" cy="70" r="4" fill="#3D2B1F" stroke="#8B6914" strokeWidth="1" />
          <circle cx="82" cy="70" r="1.5" fill="#1a1a1a" />
        </g>
      </svg>

      {/* CSS for gear animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 25s linear infinite;
        }
        .gear-large {
          animation: spin-slow 25s linear infinite;
        }
        .gear-medium {
          animation: spin-slow 18s linear infinite reverse;
        }
        .gear-small {
          animation: spin-slow 12s linear infinite;
        }
        .gear-tiny {
          animation: spin-slow 8s linear infinite reverse;
        }
      `}</style>
    </div>
  );
}

// Static gear decoration (non-animated)
export function StaticGear({ size = 40, variant = "brass", className = "" }: {
  size?: number;
  variant?: "brass" | "copper" | "dark";
  className?: string;
}) {
  const colors = {
    brass: { outer: "#D4AF37", inner: "#B8860B", dark: "#8B6914" },
    copper: { outer: "#CD7F32", inner: "#A66628", dark: "#8B4513" },
    dark: { outer: "#A67C00", inner: "#8B6914", dark: "#6B4E11" },
  };

  const c = colors[variant];
  const teeth = size > 30 ? 12 : 8;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <defs>
        <linearGradient id={`staticGear-${variant}-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.outer} />
          <stop offset="50%" stopColor={c.inner} />
          <stop offset="100%" stopColor={c.dark} />
        </linearGradient>
      </defs>
      <path
        d={generateGearPath(20, 20, 12, 17, teeth)}
        fill={`url(#staticGear-${variant}-${size})`}
        stroke={c.dark}
        strokeWidth="0.5"
      />
      <circle cx="20" cy="20" r="8" fill="#3D2B1F" stroke={c.inner} strokeWidth="1" />
      <circle cx="20" cy="20" r="3" fill="#1a1a1a" />
    </svg>
  );
}
