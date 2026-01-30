"use client";

interface BotanicalDecorProps {
  variant: "flower" | "leaves" | "bee" | "mixed";
  className?: string;
  size?: number;
}

export function BotanicalDecor({ variant, className = "", size = 80 }: BotanicalDecorProps) {
  const renderDecor = () => {
    switch (variant) {
      case "flower":
        return <FlowerSVG />;
      case "leaves":
        return <LeavesSVG />;
      case "bee":
        return <MechanicalBeeSVG />;
      case "mixed":
        return <MixedBotanicalSVG />;
      default:
        return <FlowerSVG />;
    }
  };

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 60 60">
        {renderDecor()}
      </svg>
    </div>
  );
}

function FlowerSVG() {
  return (
    <g>
      <defs>
        {/* LAYER 5 - Innermost/darkest petals gradient - rich crimson matching mock #8B4557 */}
        <linearGradient id="petalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C45068" />
          <stop offset="40%" stopColor="#A83E55" />
          <stop offset="70%" stopColor="#8B4557" />
          <stop offset="100%" stopColor="#6E3545" />
        </linearGradient>
        {/* LAYER 4 - Inner petals gradient - truer pink/magenta */}
        <linearGradient id="petalGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E87898" />
          <stop offset="50%" stopColor="#D05878" />
          <stop offset="100%" stopColor="#BB4868" />
        </linearGradient>
        {/* LAYER 3 - Middle petals gradient - truer pink/magenta */}
        <linearGradient id="petalGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5A8B8" />
          <stop offset="50%" stopColor="#E58098" />
          <stop offset="100%" stopColor="#D05878" />
        </linearGradient>
        {/* LAYER 2 - Outer petals gradient - truer pink/magenta */}
        <linearGradient id="petalGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCC8D0" />
          <stop offset="50%" stopColor="#F5A8B8" />
          <stop offset="100%" stopColor="#E58098" />
        </linearGradient>
        {/* LAYER 1 - Outermost/lightest petals gradient - truer pink/magenta */}
        <linearGradient id="petalGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE8F0" />
          <stop offset="25%" stopColor="#FCC8D0" />
          <stop offset="60%" stopColor="#F5B8C0" />
          <stop offset="100%" stopColor="#F5A8B8" />
        </linearGradient>
        <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9BC78C" />
          <stop offset="15%" stopColor="#8B9A6B" />
          <stop offset="30%" stopColor="#7BA05B" />
          <stop offset="50%" stopColor="#6B8E23" />
          <stop offset="70%" stopColor="#4A5D23" />
          <stop offset="85%" stopColor="#3D5020" />
          <stop offset="100%" stopColor="#2D3F14" />
        </linearGradient>
        <linearGradient id="stemGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4A6B18" />
          <stop offset="50%" stopColor="#6B8E23" />
          <stop offset="100%" stopColor="#4A6B18" />
        </linearGradient>
        <radialGradient id="centerGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFDE8" />
          <stop offset="15%" stopColor="#FFE857" />
          <stop offset="40%" stopColor="#E5B828" />
          <stop offset="70%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8B6914" />
        </radialGradient>
      </defs>

      {/* Main stem with curve - thicker */}
      <path
        d="M30 60 Q28 52 29 44 Q30 38 30 30"
        stroke="url(#stemGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Leaf cluster on stem - left side - ENHANCED with detailed veins */}
      <g transform="translate(12, 42)">
        <ellipse cx="9" cy="5" rx="12" ry="6" fill="url(#leafGradient)" transform="rotate(-35 9 5)" />
        {/* Central vein */}
        <path d="M9 5 L1 1" stroke="#4A6B18" strokeWidth="1.2" fill="none" />
        {/* Secondary veins */}
        <path d="M7 4 L3 3" stroke="#4A6B18" strokeWidth="0.8" fill="none" />
        <path d="M6 3 L2 5" stroke="#4A6B18" strokeWidth="0.7" fill="none" />
        <path d="M8 4 L4 7" stroke="#4A6B18" strokeWidth="0.7" fill="none" />
        <path d="M11 5 L7 8" stroke="#4A6B18" strokeWidth="0.6" fill="none" />
        <path d="M13 6 L10 9" stroke="#4A6B18" strokeWidth="0.5" fill="none" />
        {/* Tertiary veins */}
        <path d="M5 2.5 L3 4" stroke="#556B2F" strokeWidth="0.4" fill="none" />
        <path d="M7 3.5 L5 5.5" stroke="#556B2F" strokeWidth="0.4" fill="none" />
        <path d="M10 5 L8 7" stroke="#556B2F" strokeWidth="0.4" fill="none" />
      </g>

      {/* Leaf cluster on stem - right side - ENHANCED with detailed veins */}
      <g transform="translate(32, 46)">
        <ellipse cx="7" cy="5" rx="11" ry="5" fill="url(#leafGradient)" transform="rotate(30 7 5)" />
        {/* Central vein */}
        <path d="M7 5 L14 2" stroke="#4A6B18" strokeWidth="1.2" fill="none" />
        {/* Secondary veins */}
        <path d="M5 4 L8 7" stroke="#4A6B18" strokeWidth="0.7" fill="none" />
        <path d="M8 4 L11 6" stroke="#4A6B18" strokeWidth="0.7" fill="none" />
        <path d="M10 4 L13 3" stroke="#4A6B18" strokeWidth="0.6" fill="none" />
        <path d="M10 5 L7 8" stroke="#4A6B18" strokeWidth="0.5" fill="none" />
        {/* Tertiary veins */}
        <path d="M6 4.5 L8 6" stroke="#556B2F" strokeWidth="0.4" fill="none" />
        <path d="M9 4 L11 5" stroke="#556B2F" strokeWidth="0.4" fill="none" />
      </g>

      {/* Small leaf bud near flower - larger with veins */}
      <ellipse cx="25" cy="35" rx="5" ry="2.5" fill="url(#leafGradient)" transform="rotate(-25 25 35)" />
      <path d="M25 35 L22 33" stroke="#4A6B18" strokeWidth="0.7" fill="none" />
      <path d="M24 34.5 L22 35.5" stroke="#4A6B18" strokeWidth="0.4" fill="none" />

      {/* LAYER 1: Outermost petals - 8 large petals with asymmetric organic cascade (lightest #F5C4D4) */}
      {[15, 45, 75, 105, 135, 160, 190, 220].map((angle, i) => (
        <ellipse
          key={`outer1-${i}`}
          cx="30"
          cy={11 + Math.sin(angle * 0.3) * 1.5}
          rx="7"
          ry="17"
          fill="url(#petalGradient5)"
          transform={`rotate(${angle} 30 30)`}
          opacity="0.55"
        />
      ))}

      {/* LAYER 2: Outer petals - 8 petals offset */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
        <ellipse
          key={`outer2-${i}`}
          cx="30"
          cy="13"
          rx="6.5"
          ry="15"
          fill="url(#petalGradient4)"
          transform={`rotate(${angle} 30 30)`}
          opacity="0.65"
        />
      ))}

      {/* LAYER 3: Middle petals - 8 petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <ellipse
          key={`middle-${i}`}
          cx="30"
          cy="16"
          rx="5.5"
          ry="12"
          fill="url(#petalGradient3)"
          transform={`rotate(${angle} 30 30)`}
          opacity="0.75"
        />
      ))}

      {/* LAYER 4: Inner petals - 8 petals offset */}
      {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => (
        <ellipse
          key={`inner1-${i}`}
          cx="30"
          cy="19"
          rx="4.5"
          ry="9"
          fill="url(#petalGradient2)"
          transform={`rotate(${angle} 30 30)`}
          opacity="0.85"
        />
      ))}

      {/* LAYER 5: Core petals - 8 smallest petals (darkest #9E3A5E) */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <ellipse
          key={`inner2-${i}`}
          cx="30"
          cy="22"
          rx="3"
          ry="6"
          fill="url(#petalGradient)"
          transform={`rotate(${angle} 30 30)`}
          opacity="0.95"
        />
      ))}

      {/* LAYER 6: Extra inner petals - pointed variant with narrower rx */}
      {[15, 60, 105, 150, 195, 240, 285, 330].map((angle, i) => (
        <ellipse
          key={`inner3-${i}`}
          cx="30"
          cy="24"
          rx="2"
          ry="5"
          fill="url(#petalGradient)"
          transform={`rotate(${angle} 30 30)`}
          opacity="0.9"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.3"
        />
      ))}

      {/* LAYER 7: Innermost pointed petals - very narrow rx=1.5 */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <ellipse
          key={`inner4-${i}`}
          cx="30"
          cy="26"
          rx="1.5"
          ry="4"
          fill="url(#petalGradient)"
          transform={`rotate(${angle} 30 30)`}
          opacity="0.85"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.2"
        />
      ))}

      {/* Center - brass mechanical style - ENHANCED */}
      <circle cx="30" cy="30" r="10" fill="url(#centerGradient)" stroke="#6B4E11" strokeWidth="2" />
      <circle cx="30" cy="30" r="6" fill="#3D2B1F" stroke="#8B6914" strokeWidth="1" />
      <circle cx="30" cy="30" r="3" fill="#D4AF37" />

      {/* STAMEN DOTS - 7 dots around center with yellow gradient */}
      {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((angle, i) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const x = 30 + 7 * Math.cos(rad);
        const y = 30 + 7 * Math.sin(rad);
        return (
          <g key={`stamen-${i}`}>
            <circle cx={x} cy={y} r="1.2" fill="#FFE857" />
            <circle cx={x - 0.3} cy={y - 0.3} r="0.4" fill="#FFFDE8" opacity="0.8" />
          </g>
        );
      })}

      {/* Center highlights */}
      <circle cx="28" cy="28" r="2" fill="#FFE857" opacity="0.6" />
      <circle cx="27" cy="27" r="0.8" fill="#FFFDE8" opacity="0.5" />
    </g>
  );
}

function LeavesSVG() {
  return (
    <g>
      <defs>
        <linearGradient id="leaf1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8FBC8F" />
          <stop offset="30%" stopColor="#7BA05B" />
          <stop offset="60%" stopColor="#6B8E23" />
          <stop offset="100%" stopColor="#3D4F1F" />
        </linearGradient>
        <linearGradient id="leaf2Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7BA05B" />
          <stop offset="40%" stopColor="#6B8E23" />
          <stop offset="70%" stopColor="#4A6B18" />
          <stop offset="100%" stopColor="#2D3F14" />
        </linearGradient>
        <linearGradient id="vineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3D4F1F" />
          <stop offset="50%" stopColor="#556B2F" />
          <stop offset="100%" stopColor="#3D4F1F" />
        </linearGradient>
      </defs>

      {/* Trailing vine stem */}
      <path
        d="M30 58 Q25 50 28 42 Q32 35 30 28 Q28 22 30 15 Q32 10 30 5"
        stroke="url(#vineGradient)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Main leaf */}
      <path
        d="M30 50 Q12 35 18 20 Q24 10 30 5 Q36 10 42 20 Q48 35 30 50 Z"
        fill="url(#leaf1Gradient)"
        stroke="#4A6B18"
        strokeWidth="0.75"
      />
      {/* Main leaf veins */}
      <path d="M30 48 L30 10" stroke="#4A6B18" strokeWidth="1.5" fill="none" />
      <path d="M30 42 L22 34" stroke="#4A6B18" strokeWidth="0.75" fill="none" />
      <path d="M30 42 L38 34" stroke="#4A6B18" strokeWidth="0.75" fill="none" />
      <path d="M30 32 L20 24" stroke="#4A6B18" strokeWidth="0.75" fill="none" />
      <path d="M30 32 L40 24" stroke="#4A6B18" strokeWidth="0.75" fill="none" />
      <path d="M30 22 L24 16" stroke="#4A6B18" strokeWidth="0.5" fill="none" />
      <path d="M30 22 L36 16" stroke="#4A6B18" strokeWidth="0.5" fill="none" />

      {/* Secondary leaf - right */}
      <g transform="translate(40, 38)">
        <path
          d="M8 12 Q16 8 14 0 Q10 -4 6 2 Q2 8 8 12 Z"
          fill="url(#leaf2Gradient)"
          stroke="#3D4F1F"
          strokeWidth="0.5"
        />
        <path d="M8 10 L12 2" stroke="#3D4F1F" strokeWidth="0.5" fill="none" />
      </g>

      {/* Small accent leaf - left */}
      <g transform="translate(4, 42)">
        <path
          d="M8 10 Q2 6 4 0 Q8 -2 10 4 Q12 8 8 10 Z"
          fill="url(#leaf2Gradient)"
          stroke="#3D4F1F"
          strokeWidth="0.5"
        />
        <path d="M7 8 L5 2" stroke="#3D4F1F" strokeWidth="0.5" fill="none" />
      </g>

      {/* Curling tendril */}
      <path
        d="M36 20 Q42 18 44 14 Q46 10 44 8 Q42 6 40 8"
        stroke="#556B2F"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />

      {/* Small leaf buds along vine */}
      <ellipse cx="26" cy="36" rx="3" ry="1.5" fill="url(#leaf2Gradient)" transform="rotate(-30 26 36)" />
      <ellipse cx="34" cy="24" rx="3" ry="1.5" fill="url(#leaf2Gradient)" transform="rotate(25 34 24)" />
    </g>
  );
}

function MechanicalBeeSVG() {
  return (
    <g>
      <defs>
        <linearGradient id="beeBodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C252" />
          <stop offset="30%" stopColor="#D4AF37" />
          <stop offset="60%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(212, 175, 55, 0.5)" />
          <stop offset="50%" stopColor="rgba(184, 134, 11, 0.3)" />
          <stop offset="100%" stopColor="rgba(139, 105, 20, 0.15)" />
        </linearGradient>
        <radialGradient id="beeRivetGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#E8C252" />
          <stop offset="100%" stopColor="#6B4E11" />
        </radialGradient>
      </defs>

      {/* Wings with gear details */}
      <g transform="translate(14, 14)">
        <ellipse cx="8" cy="8" rx="14" ry="9" fill="url(#wingGradient)" stroke="#B8860B" strokeWidth="0.75" transform="rotate(-20 8 8)" />
        {/* Wing gear teeth */}
        <circle cx="2" cy="4" r="1.5" fill="#B8860B" opacity="0.5" />
        <circle cx="6" cy="2" r="1.5" fill="#B8860B" opacity="0.5" />
        <circle cx="12" cy="3" r="1.5" fill="#B8860B" opacity="0.5" />
        {/* Wing axle */}
        <circle cx="8" cy="12" r="2" fill="#8B6914" stroke="#6B4E11" strokeWidth="0.5" />
      </g>
      <g transform="translate(32, 14)">
        <ellipse cx="6" cy="8" rx="14" ry="9" fill="url(#wingGradient)" stroke="#B8860B" strokeWidth="0.75" transform="rotate(20 6 8)" />
        <circle cx="2" cy="3" r="1.5" fill="#B8860B" opacity="0.5" />
        <circle cx="8" cy="2" r="1.5" fill="#B8860B" opacity="0.5" />
        <circle cx="12" cy="4" r="1.5" fill="#B8860B" opacity="0.5" />
        <circle cx="6" cy="12" r="2" fill="#8B6914" stroke="#6B4E11" strokeWidth="0.5" />
      </g>

      {/* Body segments */}
      <ellipse cx="30" cy="38" rx="11" ry="16" fill="url(#beeBodyGradient)" stroke="#6B4E11" strokeWidth="1" />

      {/* Stripes - mechanical plates with stronger contrast */}
      <rect x="21" y="28" width="18" height="2.8" fill="#1a1410" rx="0.5" />
      <rect x="20" y="35" width="20" height="2.8" fill="#1a1410" rx="0.5" />
      <rect x="21" y="42" width="18" height="2.8" fill="#1a1410" rx="0.5" />

      {/* Rivets on body */}
      <circle cx="23" cy="31" r="1.2" fill="url(#beeRivetGrad)" />
      <circle cx="37" cy="31" r="1.2" fill="url(#beeRivetGrad)" />
      <circle cx="23" cy="39" r="1.2" fill="url(#beeRivetGrad)" />
      <circle cx="37" cy="39" r="1.2" fill="url(#beeRivetGrad)" />
      <circle cx="23" cy="46" r="1" fill="url(#beeRivetGrad)" />
      <circle cx="37" cy="46" r="1" fill="url(#beeRivetGrad)" />

      {/* Head */}
      <circle cx="30" cy="18" r="8" fill="url(#beeBodyGradient)" stroke="#6B4E11" strokeWidth="1" />

      {/* Eyes - mechanical lens */}
      <circle cx="26" cy="16" r="3" fill="#1a1a1a" stroke="#6B4E11" strokeWidth="0.5" />
      <circle cx="34" cy="16" r="3" fill="#1a1a1a" stroke="#6B4E11" strokeWidth="0.5" />
      <circle cx="25.5" cy="15" r="1" fill="#CD7F32" />
      <circle cx="33.5" cy="15" r="1" fill="#CD7F32" />

      {/* Antennae */}
      <path d="M26 11 Q23 6 20 4" stroke="#8B6914" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M34 11 Q37 6 40 4" stroke="#8B6914" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="4" r="2.5" fill="#CD7F32" stroke="#8B6914" strokeWidth="0.5" />
      <circle cx="40" cy="4" r="2.5" fill="#CD7F32" stroke="#8B6914" strokeWidth="0.5" />

      {/* Stinger */}
      <path d="M30 54 L30 59" stroke="#8B6914" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 56 L30 59 L32 56" stroke="#CD7F32" strokeWidth="1" fill="none" />
    </g>
  );
}

function MixedBotanicalSVG() {
  return (
    <g>
      <defs>
        <linearGradient id="mixedLeafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8FBC8F" />
          <stop offset="50%" stopColor="#6B8E23" />
          <stop offset="100%" stopColor="#4A6B18" />
        </linearGradient>
        <linearGradient id="mixedFlowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8A0B8" />
          <stop offset="50%" stopColor="#D4708A" />
          <stop offset="100%" stopColor="#C04E77" />
        </linearGradient>
        <linearGradient id="mixedStemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4A6B18" />
          <stop offset="50%" stopColor="#6B8E23" />
          <stop offset="100%" stopColor="#4A6B18" />
        </linearGradient>
        <radialGradient id="mixedCenterGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#E8C252" />
          <stop offset="100%" stopColor="#8B6914" />
        </radialGradient>
      </defs>

      {/* Curved main stem */}
      <path
        d="M8 58 Q15 48 20 40 Q26 30 32 22 Q36 16 38 12"
        stroke="url(#mixedStemGrad)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Secondary vine */}
      <path
        d="M20 40 Q24 36 30 38 Q36 40 40 36"
        stroke="#6B8E23"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />

      {/* Leaves along stem */}
      <g transform="translate(12, 46)">
        <ellipse cx="6" cy="4" rx="8" ry="4" fill="url(#mixedLeafGrad)" transform="rotate(-40 6 4)" />
        <path d="M6 4 L2 2" stroke="#4A6B18" strokeWidth="0.5" fill="none" />
      </g>
      <g transform="translate(22, 34)">
        <ellipse cx="6" cy="3" rx="7" ry="3.5" fill="url(#mixedLeafGrad)" transform="rotate(35 6 3)" />
        <path d="M6 3 L10 1" stroke="#4A6B18" strokeWidth="0.5" fill="none" />
      </g>
      <g transform="translate(36, 34)">
        <ellipse cx="4" cy="3" rx="5" ry="2.5" fill="url(#mixedLeafGrad)" transform="rotate(-20 4 3)" />
      </g>

      {/* Curling tendril */}
      <path
        d="M40 36 Q46 34 48 30 Q50 26 48 24 Q46 22 44 24"
        stroke="#556B2F"
        strokeWidth="0.75"
        fill="none"
        strokeLinecap="round"
      />

      {/* Small flower */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <ellipse
          key={i}
          cx="38"
          cy="8"
          rx="4"
          ry="7"
          fill="url(#mixedFlowerGrad)"
          transform={`rotate(${angle} 38 14)`}
          opacity="0.85"
        />
      ))}
      <circle cx="38" cy="14" r="5" fill="url(#mixedCenterGrad)" stroke="#6B4E11" strokeWidth="0.75" />
      <circle cx="38" cy="14" r="2" fill="#3D2B1F" />

      {/* Tiny mechanical bee */}
      <g transform="translate(2, 6) scale(0.35)">
        <ellipse cx="15" cy="12" rx="8" ry="5" fill="rgba(212, 175, 55, 0.5)" stroke="#B8860B" strokeWidth="0.5" transform="rotate(-15 15 12)" />
        <ellipse cx="28" cy="12" rx="8" ry="5" fill="rgba(212, 175, 55, 0.5)" stroke="#B8860B" strokeWidth="0.5" transform="rotate(15 28 12)" />
        <ellipse cx="22" cy="22" rx="6" ry="10" fill="#B8860B" stroke="#8B6914" strokeWidth="0.5" />
        <rect x="17" y="18" width="10" height="1.8" fill="#1a1410" />
        <rect x="17" y="23" width="10" height="1.8" fill="#1a1410" />
        <circle cx="22" cy="12" r="5" fill="#B8860B" stroke="#8B6914" strokeWidth="0.5" />
        <circle cx="20" cy="11" r="1.5" fill="#1a1a1a" />
        <circle cx="24" cy="11" r="1.5" fill="#1a1a1a" />
        <path d="M20 7 Q18 4 16 3" stroke="#8B6914" strokeWidth="1" fill="none" />
        <path d="M24 7 Q26 4 28 3" stroke="#8B6914" strokeWidth="1" fill="none" />
      </g>
    </g>
  );
}

// ENHANCED Divider component with botanical elements and ornate brass flourishes
export function BotanicalDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-4 ${className}`}>
      <svg width="380" height="60" viewBox="0 0 380 60">
        <defs>
          <linearGradient id="dividerLeaf" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8FBC8F" />
            <stop offset="30%" stopColor="#7BA05B" />
            <stop offset="60%" stopColor="#6B8E23" />
            <stop offset="100%" stopColor="#4A6B18" />
          </linearGradient>
          <linearGradient id="dividerBrass" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="10%" stopColor="#6B4E11" />
            <stop offset="20%" stopColor="#8B6914" />
            <stop offset="35%" stopColor="#B8860B" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="65%" stopColor="#B8860B" />
            <stop offset="80%" stopColor="#8B6914" />
            <stop offset="90%" stopColor="#6B4E11" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="dividerBrassVertical" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F0D060" />
            <stop offset="30%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#B8860B" />
            <stop offset="100%" stopColor="#6B4E11" />
          </linearGradient>
          <linearGradient id="dividerPetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8A0B8" />
            <stop offset="50%" stopColor="#D4708A" />
            <stop offset="100%" stopColor="#C04E77" />
          </linearGradient>
          <radialGradient id="dividerGearGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F0D060" />
            <stop offset="30%" stopColor="#D4AF37" />
            <stop offset="60%" stopColor="#B8860B" />
            <stop offset="100%" stopColor="#6B4E11" />
          </radialGradient>
          <radialGradient id="dividerRivet" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#F0D060" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#5A3D0A" />
          </radialGradient>
        </defs>

        {/* Ornate brass scrollwork flourishes - left */}
        <g transform="translate(30, 30)">
          <path d="M0 0 Q-15 -8 -25 0 Q-35 8 -25 15 Q-15 22 0 15 M0 0 Q-10 5 -15 0"
                stroke="url(#dividerBrassVertical)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="-25" cy="8" r="3" fill="url(#dividerRivet)" />
        </g>

        {/* Central brass line - ENHANCED with decorative elements */}
        <rect x="30" y="28" width="320" height="4" fill="url(#dividerBrass)" rx="2" />
        <rect x="30" y="29" width="320" height="1.5" fill="rgba(255,255,255,0.2)" rx="1" />

        {/* Ornate brass scrollwork flourishes - right */}
        <g transform="translate(350, 30)">
          <path d="M0 0 Q15 -8 25 0 Q35 8 25 15 Q15 22 0 15 M0 0 Q10 5 15 0"
                stroke="url(#dividerBrassVertical)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="25" cy="8" r="3" fill="url(#dividerRivet)" />
        </g>

        {/* Left leaf cluster with stem - LARGER */}
        <path d="M70 30 Q85 30 100 30" stroke="#6B8E23" strokeWidth="2" fill="none" />
        <ellipse cx="85" cy="20" rx="18" ry="8" fill="url(#dividerLeaf)" transform="rotate(-20 85 20)" />
        <ellipse cx="72" cy="26" rx="15" ry="6" fill="url(#dividerLeaf)" transform="rotate(15 72 26)" />
        <ellipse cx="100" cy="38" rx="13" ry="5" fill="url(#dividerLeaf)" transform="rotate(-10 100 38)" />
        {/* Leaf veins - detailed */}
        <path d="M85 20 L76 16" stroke="#4A6B18" strokeWidth="0.75" fill="none" />
        <path d="M85 20 L80 24" stroke="#4A6B18" strokeWidth="0.5" fill="none" />
        <path d="M72 26 L64 23" stroke="#4A6B18" strokeWidth="0.75" fill="none" />

        {/* Center gear - ENHANCED with teeth */}
        <circle cx="190" cy="30" r="18" fill="url(#dividerGearGrad)" stroke="#5A3D0A" strokeWidth="2" />
        {/* Gear teeth */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <rect
            key={i}
            x="187" y="10" width="6" height="6"
            fill="url(#dividerGearGrad)"
            transform={`rotate(${angle} 190 30)`}
            rx="1"
          />
        ))}
        <circle cx="190" cy="30" r="11" fill="#3D2B1F" stroke="#8B6914" strokeWidth="1.5" />
        <circle cx="190" cy="30" r="4" fill="#D4AF37" />
        {/* Gear spokes */}
        <line x1="190" y1="20" x2="190" y2="40" stroke="#6B4E11" strokeWidth="2.5" />
        <line x1="180" y1="30" x2="200" y2="30" stroke="#6B4E11" strokeWidth="2.5" />

        {/* Decorative rivets along the line */}
        <circle cx="60" cy="30" r="3" fill="url(#dividerRivet)" />
        <circle cx="120" cy="30" r="2.5" fill="url(#dividerRivet)" />
        <circle cx="260" cy="30" r="2.5" fill="url(#dividerRivet)" />
        <circle cx="320" cy="30" r="3" fill="url(#dividerRivet)" />

        {/* Right leaf cluster with stem - LARGER */}
        <path d="M280 30 Q295 30 310 30" stroke="#6B8E23" strokeWidth="2" fill="none" />
        <ellipse cx="295" cy="20" rx="18" ry="8" fill="url(#dividerLeaf)" transform="rotate(20 295 20)" />
        <ellipse cx="308" cy="26" rx="15" ry="6" fill="url(#dividerLeaf)" transform="rotate(-15 308 26)" />
        <ellipse cx="280" cy="38" rx="13" ry="5" fill="url(#dividerLeaf)" transform="rotate(10 280 38)" />
        {/* Leaf veins - detailed */}
        <path d="M295 20 L304 16" stroke="#4A6B18" strokeWidth="0.75" fill="none" />
        <path d="M295 20 L300 24" stroke="#4A6B18" strokeWidth="0.5" fill="none" />
        <path d="M308 26 L316 23" stroke="#4A6B18" strokeWidth="0.75" fill="none" />

        {/* LARGER flowers - left of center */}
        <g transform="translate(140, 24)">
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <ellipse
              key={i}
              cx="6"
              cy="2"
              rx="3"
              ry="6"
              fill="url(#dividerPetal)"
              transform={`rotate(${angle} 6 6)`}
              opacity="0.9"
            />
          ))}
          <circle cx="6" cy="6" r="4" fill="#D4AF37" stroke="#8B6914" strokeWidth="0.75" />
          <circle cx="6" cy="6" r="1.5" fill="#3D2B1F" />
        </g>
        {/* LARGER flowers - right of center */}
        <g transform="translate(228, 24)">
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <ellipse
              key={i}
              cx="6"
              cy="2"
              rx="3"
              ry="6"
              fill="url(#dividerPetal)"
              transform={`rotate(${angle} 6 6)`}
              opacity="0.9"
            />
          ))}
          <circle cx="6" cy="6" r="4" fill="#D4AF37" stroke="#8B6914" strokeWidth="0.75" />
          <circle cx="6" cy="6" r="1.5" fill="#3D2B1F" />
        </g>

        {/* Curling tendrils - more ornate */}
        <path d="M108 26 Q115 20 120 14 Q124 8 122 4 Q120 2 118 4" stroke="#556B2F" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M272 26 Q265 20 260 14 Q256 8 258 4 Q260 2 262 4" stroke="#556B2F" strokeWidth="1" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
