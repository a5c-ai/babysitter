"use client";

interface BrassPipeBorderProps {
  side: "left" | "right";
  className?: string;
}

export function BrassPipeBorder({ side, className = "" }: BrassPipeBorderProps) {
  const isLeft = side === "left";

  return (
    <div
      className={`fixed top-0 ${isLeft ? "left-0" : "right-0"} h-full pointer-events-none z-10 ${className}`}
      style={{ width: "110px" }}
    >
      <svg
        width="110"
        height="100%"
        viewBox="0 0 110 800"
        preserveAspectRatio="none"
        className="h-full"
        style={{ transform: isLeft ? "none" : "scaleX(-1)" }}
      >
        <defs>
          {/* Enhanced brass pipe gradient - more metallic with specular highlight */}
          <linearGradient id={`pipeGradient-${side}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6B4E11" />
            <stop offset="10%" stopColor="#8B6914" />
            <stop offset="30%" stopColor="#E5B828" />
            <stop offset="45%" stopColor="#FFE857" />
            <stop offset="50%" stopColor="#FFFDE8" />
            <stop offset="55%" stopColor="#FFE857" />
            <stop offset="70%" stopColor="#E5B828" />
            <stop offset="90%" stopColor="#8B6914" />
            <stop offset="100%" stopColor="#6B4E11" />
          </linearGradient>

          {/* Joint gradient - copper tone */}
          <linearGradient id={`jointGradient-${side}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5A3D0A" />
            <stop offset="20%" stopColor="#8B6914" />
            <stop offset="40%" stopColor="#CD7F32" />
            <stop offset="50%" stopColor="#E8A065" />
            <stop offset="60%" stopColor="#CD7F32" />
            <stop offset="80%" stopColor="#8B6914" />
            <stop offset="100%" stopColor="#5A3D0A" />
          </linearGradient>

          {/* Rivet gradient - enhanced specular */}
          <radialGradient id={`rivetGradient-${side}`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFDE8" />
            <stop offset="15%" stopColor="#FFE857" />
            <stop offset="45%" stopColor="#E5B828" />
            <stop offset="100%" stopColor="#5A3D0A" />
          </radialGradient>

          {/* Valve wheel gradient - enhanced */}
          <linearGradient id={`valveWheelGrad-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDE8" />
            <stop offset="10%" stopColor="#FFE857" />
            <stop offset="40%" stopColor="#E5B828" />
            <stop offset="70%" stopColor="#B8860B" />
            <stop offset="100%" stopColor="#6B4E11" />
          </linearGradient>

          {/* Temperature gauge colored zones gradient */}
          <linearGradient id={`tempZoneGrad-${side}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4A90D9" />
            <stop offset="35%" stopColor="#4CAF50" />
            <stop offset="65%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#F44336" />
          </linearGradient>
        </defs>

        {/* Main vertical pipe - much thicker 85px wide */}
        <rect x="8" y="0" width="45" height="800" fill={`url(#pipeGradient-${side})`} />
        {/* Pipe highlight - centered */}
        <rect x="24" y="0" width="8" height="800" fill="rgba(255,255,255,0.18)" />
        {/* Pipe shadow edges - deeper */}
        <rect x="8" y="0" width="5" height="800" fill="rgba(0,0,0,0.25)" />
        <rect x="48" y="0" width="5" height="800" fill="rgba(0,0,0,0.2)" />

        {/* Top elbow joint - larger */}
        <g transform="translate(0, 30)">
          {/* Horizontal pipe segment */}
          <rect x="0" y="4" width="18" height="32" fill={`url(#pipeGradient-${side})`} />
          {/* Elbow connector - larger */}
          <circle cx="38" cy="20" r="24" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="3" />
          {/* Inner elbow detail */}
          <circle cx="38" cy="20" r="14" fill="#2D1F14" />
          <circle cx="38" cy="20" r="9" fill="#1a1a1a" />
          {/* Rivets on elbow - larger */}
          <circle cx="20" cy="8" r="4.5" fill={`url(#rivetGradient-${side})`} />
          <circle cx="20" cy="32" r="4.5" fill={`url(#rivetGradient-${side})`} />
          <circle cx="56" cy="20" r="4" fill={`url(#rivetGradient-${side})`} />
        </g>

        {/* T-connector at 150px with enhanced detail - larger */}
        <g transform="translate(0, 150)">
          <rect x="0" y="0" width="18" height="36" fill={`url(#pipeGradient-${side})`} />
          {/* T-joint body - larger */}
          <rect x="6" y="-4" width="55" height="44" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="3" rx="4" />
          {/* Decorative ring */}
          <rect x="10" y="0" width="48" height="6" fill="rgba(255,255,255,0.12)" rx="2" />
          <rect x="10" y="32" width="48" height="6" fill="rgba(0,0,0,0.18)" rx="2" />
          {/* Rivets - larger */}
          <circle cx="18" cy="8" r="4" fill={`url(#rivetGradient-${side})`} />
          <circle cx="52" cy="8" r="4" fill={`url(#rivetGradient-${side})`} />
          <circle cx="18" cy="28" r="4" fill={`url(#rivetGradient-${side})`} />
          <circle cx="52" cy="28" r="4" fill={`url(#rivetGradient-${side})`} />
        </g>

        {/* Valve wheel at 300px - LARGE 55px wheel with prominent 8 spokes */}
        <g transform="translate(0, 280)">
          {/* Valve body - larger */}
          <rect x="4" y="-12" width="60" height="80" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="3" rx="5" />
          {/* Valve wheel outer ring - 55px diameter */}
          <circle cx="34" cy="28" r="27" fill="none" stroke={`url(#valveWheelGrad-${side})`} strokeWidth="8" />
          {/* Wheel rim highlight */}
          <circle cx="34" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
          {/* Wheel rim shadow */}
          <circle cx="34" cy="28" r="30" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
          {/* Center hub - larger */}
          <circle cx="34" cy="28" r="10" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          <circle cx="34" cy="28" r="5" fill="#2D1F14" />
          <circle cx="32" cy="26" r="1.5" fill="#E8C252" opacity="0.5" />
          {/* 8 Prominent Spokes */}
          <line x1="34" y1="3" x2="34" y2="53" stroke="#8B6914" strokeWidth="5" />
          <line x1="9" y1="28" x2="59" y2="28" stroke="#8B6914" strokeWidth="5" />
          <line x1="16" y1="11" x2="52" y2="45" stroke="#8B6914" strokeWidth="4" />
          <line x1="52" y1="11" x2="16" y2="45" stroke="#8B6914" strokeWidth="4" />
          {/* Additional 4 spokes for 8-spoke wheel */}
          <line x1="20" y1="5" x2="48" y2="51" stroke="#6B4E11" strokeWidth="3" />
          <line x1="48" y1="5" x2="20" y2="51" stroke="#6B4E11" strokeWidth="3" />
          <line x1="10" y1="16" x2="58" y2="40" stroke="#6B4E11" strokeWidth="3" />
          <line x1="58" y1="16" x2="10" y2="40" stroke="#6B4E11" strokeWidth="3" />
          {/* Spoke end rivets - prominent */}
          <circle cx="34" cy="3" r="4" fill={`url(#rivetGradient-${side})`} />
          <circle cx="34" cy="53" r="4" fill={`url(#rivetGradient-${side})`} />
          <circle cx="9" cy="28" r="4" fill={`url(#rivetGradient-${side})`} />
          <circle cx="59" cy="28" r="4" fill={`url(#rivetGradient-${side})`} />
          <circle cx="16" cy="11" r="3" fill={`url(#rivetGradient-${side})`} />
          <circle cx="52" cy="45" r="3" fill={`url(#rivetGradient-${side})`} />
          <circle cx="52" cy="11" r="3" fill={`url(#rivetGradient-${side})`} />
          <circle cx="16" cy="45" r="3" fill={`url(#rivetGradient-${side})`} />
        </g>

        {/* Pressure Gauge at 455px - 10% LARGER (38px radius) and more prominent */}
        <g transform="translate(0, 455)">
          {/* Gauge mount pipe - wider */}
          <rect x="2" y="2" width="32" height="42" fill={`url(#jointGradient-${side})`} />
          {/* Mount flange - larger */}
          <rect x="30" y="10" width="16" height="28" fill={`url(#jointGradient-${side})`} rx="4" />
          {/* Gauge body - 10% larger (38px radius) */}
          <circle cx="68" cy="24" r="38" fill="#1a1a1a" stroke={`url(#jointGradient-${side})`} strokeWidth="8" />
          <circle cx="68" cy="24" r="29" fill="#F5E6C8" />
          {/* Gauge face details */}
          <circle cx="68" cy="24" r="27" fill="none" stroke="#3D2B1F" strokeWidth="0.8" />
          {/* Gauge markings - major */}
          <line x1="68" y1="-2" x2="68" y2="6" stroke="#3D2B1F" strokeWidth="2.5" />
          <line x1="68" y1="42" x2="68" y2="50" stroke="#3D2B1F" strokeWidth="2.5" />
          <line x1="41" y1="24" x2="49" y2="24" stroke="#3D2B1F" strokeWidth="2.5" />
          <line x1="87" y1="24" x2="95" y2="24" stroke="#3D2B1F" strokeWidth="2.5" />
          {/* Additional tick marks */}
          <line x1="50" y1="6" x2="55" y2="12" stroke="#3D2B1F" strokeWidth="1.75" />
          <line x1="86" y1="6" x2="81" y2="12" stroke="#3D2B1F" strokeWidth="1.75" />
          <line x1="50" y1="42" x2="55" y2="36" stroke="#3D2B1F" strokeWidth="1.75" />
          <line x1="86" y1="42" x2="81" y2="36" stroke="#3D2B1F" strokeWidth="1.75" />
          {/* Gauge needle - thicker, adjusted to 38-40 degree angle */}
          <line x1="68" y1="24" x2="84" y2="9" stroke="#8B0000" strokeWidth="4" strokeLinecap="round" />
          <circle cx="68" cy="24" r="6" fill="#3D2B1F" />
          <circle cx="68" cy="24" r="3" fill="#B8860B" />
          {/* Gauge text - larger */}
          <text x="68" y="40" fontSize="8" fill="#3D2B1F" textAnchor="middle" fontFamily="Georgia, serif">PSI</text>
          <text x="45" y="26" fontSize="6" fill="#6B5744" textAnchor="middle" fontFamily="Georgia, serif">0</text>
          <text x="91" y="26" fontSize="6" fill="#6B5744" textAnchor="middle" fontFamily="Georgia, serif">100</text>
        </g>

        {/* Second T-connector at 580px - larger */}
        <g transform="translate(0, 580)">
          <rect x="0" y="0" width="18" height="36" fill={`url(#pipeGradient-${side})`} />
          <rect x="6" y="-4" width="55" height="44" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="3" rx="4" />
          <rect x="10" y="0" width="48" height="6" fill="rgba(255,255,255,0.12)" rx="2" />
          <rect x="10" y="32" width="48" height="6" fill="rgba(0,0,0,0.18)" rx="2" />
          <circle cx="18" cy="8" r="4" fill={`url(#rivetGradient-${side})`} />
          <circle cx="52" cy="8" r="4" fill={`url(#rivetGradient-${side})`} />
          <circle cx="18" cy="28" r="4" fill={`url(#rivetGradient-${side})`} />
          <circle cx="52" cy="28" r="4" fill={`url(#rivetGradient-${side})`} />
        </g>

        {/* Second Valve wheel at 680px - LARGE 50px wheel */}
        <g transform="translate(0, 660)">
          <rect x="4" y="-10" width="60" height="70" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="3" rx="5" />
          {/* Valve wheel - 50px diameter */}
          <circle cx="34" cy="25" r="25" fill="none" stroke={`url(#valveWheelGrad-${side})`} strokeWidth="7" />
          <circle cx="34" cy="25" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <circle cx="34" cy="25" r="9" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          <circle cx="34" cy="25" r="4" fill="#2D1F14" />
          {/* 8 Spokes */}
          <line x1="34" y1="2" x2="34" y2="48" stroke="#8B6914" strokeWidth="4" />
          <line x1="11" y1="25" x2="57" y2="25" stroke="#8B6914" strokeWidth="4" />
          <line x1="18" y1="9" x2="50" y2="41" stroke="#8B6914" strokeWidth="3.5" />
          <line x1="50" y1="9" x2="18" y2="41" stroke="#8B6914" strokeWidth="3.5" />
          {/* Spoke end rivets */}
          <circle cx="34" cy="2" r="3.5" fill={`url(#rivetGradient-${side})`} />
          <circle cx="34" cy="48" r="3.5" fill={`url(#rivetGradient-${side})`} />
          <circle cx="11" cy="25" r="3.5" fill={`url(#rivetGradient-${side})`} />
          <circle cx="57" cy="25" r="3.5" fill={`url(#rivetGradient-${side})`} />
        </g>

        {/* Pipe joints/rings throughout - LARGER and more prominent */}
        <rect x="5" y="100" width="50" height="14" fill={`url(#jointGradient-${side})`} rx="3" />
        <rect x="5" y="220" width="50" height="14" fill={`url(#jointGradient-${side})`} rx="3" />
        <rect x="5" y="400" width="50" height="14" fill={`url(#jointGradient-${side})`} rx="3" />
        <rect x="5" y="540" width="50" height="14" fill={`url(#jointGradient-${side})`} rx="3" />
        <rect x="5" y="640" width="50" height="14" fill={`url(#jointGradient-${side})`} rx="3" />
        <rect x="5" y="780" width="50" height="14" fill={`url(#jointGradient-${side})`} rx="3" />

        {/* ADDITIONAL DECORATIVE GEARS - 4 more at specified positions */}
        {/* Gear at y=120px - 28px with 10 teeth */}
        <g transform="translate(46, 118)">
          <circle cx="14" cy="14" r="14" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {/* Gear teeth */}
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle, i) => (
            <rect
              key={`gear1-${i}`}
              x="12" y="-2" width="4" height="6"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 14 14)`}
              rx="1"
            />
          ))}
          <circle cx="14" cy="14" r="8" fill="#2D1F14" stroke="#8B6914" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="4" fill={`url(#rivetGradient-${side})`} />
          {/* Spokes */}
          <line x1="14" y1="6" x2="14" y2="22" stroke="#6B4E11" strokeWidth="2" />
          <line x1="6" y1="14" x2="22" y2="14" stroke="#6B4E11" strokeWidth="2" />
        </g>

        {/* Gear at y=370px - 32px with 11 teeth */}
        <g transform="translate(60, 375)">
          <circle cx="16" cy="16" r="16" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {/* Gear teeth - 11 teeth */}
          {[0, 32.7, 65.4, 98.1, 130.8, 163.5, 196.2, 228.9, 261.6, 294.3, 327].map((angle, i) => (
            <rect
              key={`gear2-${i}`}
              x="14" y="-3" width="4" height="7"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 16 16)`}
              rx="1"
            />
          ))}
          <circle cx="16" cy="16" r="10" fill="#2D1F14" stroke="#8B6914" strokeWidth="1.5" />
          <circle cx="16" cy="16" r="5" fill={`url(#rivetGradient-${side})`} />
          {/* Spokes */}
          <line x1="16" y1="6" x2="16" y2="26" stroke="#6B4E11" strokeWidth="2.5" />
          <line x1="6" y1="16" x2="26" y2="16" stroke="#6B4E11" strokeWidth="2.5" />
          <line x1="9" y1="9" x2="23" y2="23" stroke="#6B4E11" strokeWidth="2" />
          <line x1="23" y1="9" x2="9" y2="23" stroke="#6B4E11" strokeWidth="2" />
        </g>

        {/* Gear at y=520px - 26px with 9 teeth */}
        <g transform="translate(48, 515)">
          <circle cx="13" cy="13" r="13" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {/* Gear teeth - 9 teeth */}
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => (
            <rect
              key={`gear3-${i}`}
              x="11" y="-2" width="4" height="5"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 13 13)`}
              rx="1"
            />
          ))}
          <circle cx="13" cy="13" r="7" fill="#2D1F14" stroke="#8B6914" strokeWidth="1" />
          <circle cx="13" cy="13" r="3.5" fill={`url(#rivetGradient-${side})`} />
          {/* Spokes */}
          <line x1="13" y1="6" x2="13" y2="20" stroke="#6B4E11" strokeWidth="1.8" />
          <line x1="6" y1="13" x2="20" y2="13" stroke="#6B4E11" strokeWidth="1.8" />
        </g>

        {/* Gear at y=720px - 35px with 12 teeth */}
        <g transform="translate(58, 722)">
          <circle cx="17" cy="17" r="17" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2.5" />
          {/* Gear teeth - 12 teeth */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
            <rect
              key={`gear4-${i}`}
              x="15" y="-3" width="4" height="7"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 17 17)`}
              rx="1"
            />
          ))}
          <circle cx="17" cy="17" r="11" fill="#2D1F14" stroke="#8B6914" strokeWidth="2" />
          <circle cx="17" cy="17" r="5.5" fill={`url(#rivetGradient-${side})`} />
          {/* 8 Spokes */}
          <line x1="17" y1="6" x2="17" y2="28" stroke="#6B4E11" strokeWidth="2.5" />
          <line x1="6" y1="17" x2="28" y2="17" stroke="#6B4E11" strokeWidth="2.5" />
          <line x1="9" y1="9" x2="25" y2="25" stroke="#6B4E11" strokeWidth="2" />
          <line x1="25" y1="9" x2="9" y2="25" stroke="#6B4E11" strokeWidth="2" />
        </g>

        {/* ADDITIONAL 4 DECORATIVE GEARS - at y positions 250, 430, 620, 760 */}
        {/* Gear at y=250px - 30px with 11 teeth */}
        <g transform="translate(54, 253)">
          <circle cx="15" cy="15" r="15" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {/* Gear teeth - 11 teeth */}
          {[0, 32.7, 65.4, 98.1, 130.8, 163.5, 196.2, 228.9, 261.6, 294.3, 327].map((angle, i) => (
            <rect
              key={`gear5-${i}`}
              x="13" y="-3" width="4" height="6"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 15 15)`}
              rx="1"
            />
          ))}
          <circle cx="15" cy="15" r="9" fill="#2D1F14" stroke="#8B6914" strokeWidth="1.5" />
          <circle cx="15" cy="15" r="4.5" fill={`url(#rivetGradient-${side})`} />
          {/* Spokes */}
          <line x1="15" y1="6" x2="15" y2="24" stroke="#6B4E11" strokeWidth="2" />
          <line x1="6" y1="15" x2="24" y2="15" stroke="#6B4E11" strokeWidth="2" />
          <line x1="8" y1="8" x2="22" y2="22" stroke="#6B4E11" strokeWidth="1.5" />
          <line x1="22" y1="8" x2="8" y2="22" stroke="#6B4E11" strokeWidth="1.5" />
        </g>

        {/* Gear at y=430px - 26px with 9 teeth */}
        <g transform="translate(46, 432)">
          <circle cx="13" cy="13" r="13" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {/* Gear teeth - 9 teeth */}
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => (
            <rect
              key={`gear6-${i}`}
              x="11" y="-2" width="4" height="5"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 13 13)`}
              rx="1"
            />
          ))}
          <circle cx="13" cy="13" r="7" fill="#2D1F14" stroke="#8B6914" strokeWidth="1" />
          <circle cx="13" cy="13" r="3.5" fill={`url(#rivetGradient-${side})`} />
          {/* Spokes */}
          <line x1="13" y1="6" x2="13" y2="20" stroke="#6B4E11" strokeWidth="1.8" />
          <line x1="6" y1="13" x2="20" y2="13" stroke="#6B4E11" strokeWidth="1.8" />
        </g>

        {/* Gear at y=620px - 28px with 10 teeth */}
        <g transform="translate(60, 617)">
          <circle cx="14" cy="14" r="14" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {/* Gear teeth - 10 teeth */}
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle, i) => (
            <rect
              key={`gear7-${i}`}
              x="12" y="-2" width="4" height="6"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 14 14)`}
              rx="1"
            />
          ))}
          <circle cx="14" cy="14" r="8" fill="#2D1F14" stroke="#8B6914" strokeWidth="1.5" />
          <circle cx="14" cy="14" r="4" fill={`url(#rivetGradient-${side})`} />
          {/* Spokes */}
          <line x1="14" y1="6" x2="14" y2="22" stroke="#6B4E11" strokeWidth="2" />
          <line x1="6" y1="14" x2="22" y2="14" stroke="#6B4E11" strokeWidth="2" />
          <line x1="8" y1="8" x2="20" y2="20" stroke="#6B4E11" strokeWidth="1.5" />
          <line x1="20" y1="8" x2="8" y2="20" stroke="#6B4E11" strokeWidth="1.5" />
        </g>

        {/* Gear at y=760px - 24px with 8 teeth */}
        <g transform="translate(48, 763)">
          <circle cx="12" cy="12" r="12" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {/* Gear teeth - 8 teeth */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <rect
              key={`gear8-${i}`}
              x="10" y="-2" width="4" height="5"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 12 12)`}
              rx="1"
            />
          ))}
          <circle cx="12" cy="12" r="6" fill="#2D1F14" stroke="#8B6914" strokeWidth="1" />
          <circle cx="12" cy="12" r="3" fill={`url(#rivetGradient-${side})`} />
          {/* Spokes */}
          <line x1="12" y1="5" x2="12" y2="19" stroke="#6B4E11" strokeWidth="1.6" />
          <line x1="5" y1="12" x2="19" y2="12" stroke="#6B4E11" strokeWidth="1.6" />
        </g>

        {/* PIPE CONNECTOR FLANGES - 12px wide, 20px high */}
        {/* Flange at y=250 */}
        <rect x="0" y="245" width="12" height="20" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="1" rx="2" />
        <circle cx="6" cy="250" r="2" fill={`url(#rivetGradient-${side})`} />
        <circle cx="6" cy="260" r="2" fill={`url(#rivetGradient-${side})`} />

        {/* Flange at y=430 */}
        <rect x="0" y="425" width="12" height="20" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="1" rx="2" />
        <circle cx="6" cy="430" r="2" fill={`url(#rivetGradient-${side})`} />
        <circle cx="6" cy="440" r="2" fill={`url(#rivetGradient-${side})`} />

        {/* Flange at y=620 */}
        <rect x="0" y="615" width="12" height="20" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="1" rx="2" />
        <circle cx="6" cy="620" r="2" fill={`url(#rivetGradient-${side})`} />
        <circle cx="6" cy="630" r="2" fill={`url(#rivetGradient-${side})`} />

        {/* Flange at y=760 */}
        <rect x="0" y="755" width="12" height="20" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="1" rx="2" />
        <circle cx="6" cy="760" r="2" fill={`url(#rivetGradient-${side})`} />
        <circle cx="6" cy="770" r="2" fill={`url(#rivetGradient-${side})`} />

        {/* BRASS HOUSING RECTANGLES around pressure gauge area */}
        {/* Housing bracket above gauge */}
        <rect x="0" y="440" width="70" height="10" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="1.5" rx="2" />
        <circle cx="10" cy="445" r="3" fill={`url(#rivetGradient-${side})`} />
        <circle cx="60" cy="445" r="3" fill={`url(#rivetGradient-${side})`} />
        {/* Housing bracket below gauge */}
        <rect x="0" y="510" width="70" height="10" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="1.5" rx="2" />
        <circle cx="10" cy="515" r="3" fill={`url(#rivetGradient-${side})`} />
        <circle cx="60" cy="515" r="3" fill={`url(#rivetGradient-${side})`} />

        {/* ENHANCED PIPE JOINT FLANGES with visible bolt patterns */}
        {/* Flange at y=100 - HEX-BOLT FLANGE */}
        <g transform="translate(0, 95)">
          <rect x="3" y="0" width="54" height="24" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" rx="4" />
          {/* Hex bolt pattern */}
          <polygon points="12,3 16,5 16,9 12,11 8,9 8,5" fill={`url(#rivetGradient-${side})`} stroke="#4A3508" strokeWidth="0.5" />
          <polygon points="48,3 52,5 52,9 48,11 44,9 44,5" fill={`url(#rivetGradient-${side})`} stroke="#4A3508" strokeWidth="0.5" />
          <polygon points="12,13 16,15 16,19 12,21 8,19 8,15" fill={`url(#rivetGradient-${side})`} stroke="#4A3508" strokeWidth="0.5" />
          <polygon points="48,13 52,15 52,19 48,21 44,19 44,15" fill={`url(#rivetGradient-${side})`} stroke="#4A3508" strokeWidth="0.5" />
          <polygon points="30,8 35,11 35,16 30,19 25,16 25,11" fill={`url(#rivetGradient-${side})`} stroke="#4A3508" strokeWidth="0.5" />
          {/* Highlight line */}
          <rect x="8" y="10" width="44" height="2" fill="rgba(255,255,255,0.15)" rx="1" />
        </g>

        {/* TEMPERATURE GAUGE at y=200 - with colored zones */}
        <g transform="translate(0, 190)">
          {/* Gauge mount */}
          <rect x="2" y="8" width="28" height="30" fill={`url(#jointGradient-${side})`} />
          <rect x="26" y="14" width="14" height="20" fill={`url(#jointGradient-${side})`} rx="3" />
          {/* Gauge body */}
          <circle cx="58" cy="24" r="30" fill="#1a1a1a" stroke={`url(#jointGradient-${side})`} strokeWidth="6" />
          <circle cx="58" cy="24" r="23" fill="#F5E6C8" />
          {/* Colored zones arc */}
          <path d="M38 24 A20 20 0 0 1 78 24" fill="none" stroke="#4A90D9" strokeWidth="4" />
          <path d="M42 36 A20 20 0 0 1 38 24" fill="none" stroke="#4CAF50" strokeWidth="4" />
          <path d="M52 42 A20 20 0 0 1 42 36" fill="none" stroke="#FFC107" strokeWidth="4" />
          <path d="M64 42 A20 20 0 0 1 52 42" fill="none" stroke="#F44336" strokeWidth="4" />
          {/* Tick marks */}
          <line x1="58" y1="6" x2="58" y2="12" stroke="#3D2B1F" strokeWidth="2" />
          <line x1="78" y1="24" x2="72" y2="24" stroke="#3D2B1F" strokeWidth="2" />
          <line x1="38" y1="24" x2="44" y2="24" stroke="#3D2B1F" strokeWidth="2" />
          {/* Needle - adjusted angle */}
          <line x1="58" y1="24" x2="70" y2="16" stroke="#8B0000" strokeWidth="3" strokeLinecap="round" />
          <circle cx="58" cy="24" r="5" fill="#3D2B1F" />
          <circle cx="58" cy="24" r="2.5" fill="#B8860B" />
          {/* Labels */}
          <text x="58" y="36" fontSize="6" fill="#3D2B1F" textAnchor="middle" fontFamily="Georgia, serif">TEMP</text>
          <text x="40" y="18" fontSize="5" fill="#4A90D9" textAnchor="middle">C</text>
          <text x="76" y="18" fontSize="5" fill="#F44336" textAnchor="middle">H</text>
        </g>

        {/* Flange at y=220 - HEX-BOLT FLANGE */}
        <g transform="translate(0, 245)">
          <rect x="3" y="0" width="54" height="24" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" rx="4" />
          {/* Hex bolt pattern */}
          <polygon points="12,3 16,5 16,9 12,11 8,9 8,5" fill={`url(#rivetGradient-${side})`} stroke="#4A3508" strokeWidth="0.5" />
          <polygon points="48,3 52,5 52,9 48,11 44,9 44,5" fill={`url(#rivetGradient-${side})`} stroke="#4A3508" strokeWidth="0.5" />
          <polygon points="12,13 16,15 16,19 12,21 8,19 8,15" fill={`url(#rivetGradient-${side})`} stroke="#4A3508" strokeWidth="0.5" />
          <polygon points="48,13 52,15 52,19 48,21 44,19 44,15" fill={`url(#rivetGradient-${side})`} stroke="#4A3508" strokeWidth="0.5" />
          <polygon points="30,8 35,11 35,16 30,19 25,16 25,11" fill={`url(#rivetGradient-${side})`} stroke="#4A3508" strokeWidth="0.5" />
          {/* Highlight line */}
          <rect x="8" y="10" width="44" height="2" fill="rgba(255,255,255,0.15)" rx="1" />
        </g>

        {/* GATE VALVE with T-handle at y=350 */}
        <g transform="translate(0, 340)">
          <rect x="4" y="5" width="55" height="50" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="3" rx="4" />
          {/* T-handle */}
          <rect x="26" y="-10" width="8" height="20" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" rx="2" />
          <rect x="16" y="-14" width="28" height="8" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" rx="3" />
          {/* Handle grip rivets */}
          <circle cx="22" cy="-10" r="2.5" fill={`url(#rivetGradient-${side})`} />
          <circle cx="38" cy="-10" r="2.5" fill={`url(#rivetGradient-${side})`} />
          {/* Valve body details */}
          <rect x="10" y="18" width="40" height="6" fill="rgba(0,0,0,0.2)" rx="2" />
          <rect x="10" y="36" width="40" height="6" fill="rgba(0,0,0,0.2)" rx="2" />
          {/* Corner rivets */}
          <circle cx="14" cy="14" r="3" fill={`url(#rivetGradient-${side})`} />
          <circle cx="46" cy="14" r="3" fill={`url(#rivetGradient-${side})`} />
          <circle cx="14" cy="46" r="3" fill={`url(#rivetGradient-${side})`} />
          <circle cx="46" cy="46" r="3" fill={`url(#rivetGradient-${side})`} />
        </g>

        {/* STEAM VENT with fins at y=560 */}
        <g transform="translate(0, 550)">
          <rect x="10" y="0" width="40" height="35" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" rx="3" />
          {/* Vent fins */}
          <rect x="14" y="6" width="32" height="3" fill="rgba(0,0,0,0.4)" rx="1" />
          <rect x="14" y="12" width="32" height="3" fill="rgba(0,0,0,0.4)" rx="1" />
          <rect x="14" y="18" width="32" height="3" fill="rgba(0,0,0,0.4)" rx="1" />
          <rect x="14" y="24" width="32" height="3" fill="rgba(0,0,0,0.4)" rx="1" />
          {/* Steam wisps */}
          <path d="M25 -5 Q22 -10 25 -15 Q28 -20 25 -25" stroke="rgba(200,200,200,0.4)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M35 -3 Q38 -8 35 -13 Q32 -18 35 -23" stroke="rgba(200,200,200,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>

        {/* BALL VALVE with lever at y=600 */}
        <g transform="translate(0, 590)">
          <rect x="8" y="10" width="50" height="40" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" rx="5" />
          {/* Ball center */}
          <circle cx="33" cy="30" r="12" fill="#2D1F14" stroke="#8B6914" strokeWidth="2" />
          <circle cx="33" cy="30" r="6" fill={`url(#jointGradient-${side})`} />
          {/* Lever handle */}
          <rect x="30" y="0" width="6" height="16" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="1.5" rx="2" />
          <rect x="20" y="-4" width="26" height="8" fill={`url(#valveWheelGrad-${side})`} stroke="#5A3D0A" strokeWidth="1.5" rx="3" />
          {/* Lever grip */}
          <circle cx="24" cy="0" r="2" fill={`url(#rivetGradient-${side})`} />
          <circle cx="42" cy="0" r="2" fill={`url(#rivetGradient-${side})`} />
        </g>

        {/* FLOW METER GAUGE at y=700 */}
        <g transform="translate(0, 690)">
          {/* Mount */}
          <rect x="2" y="5" width="25" height="35" fill={`url(#jointGradient-${side})`} />
          <rect x="23" y="10" width="12" height="25" fill={`url(#jointGradient-${side})`} rx="3" />
          {/* Gauge body */}
          <circle cx="55" cy="22" r="28" fill="#1a1a1a" stroke={`url(#jointGradient-${side})`} strokeWidth="5" />
          <circle cx="55" cy="22" r="21" fill="#F5E6C8" />
          {/* Flow scale markings */}
          <path d="M55 5 L55 10" stroke="#3D2B1F" strokeWidth="2" />
          <path d="M37 22 L42 22" stroke="#3D2B1F" strokeWidth="2" />
          <path d="M68 22 L73 22" stroke="#3D2B1F" strokeWidth="2" />
          <path d="M43 10 L46 13" stroke="#3D2B1F" strokeWidth="1.5" />
          <path d="M67 10 L64 13" stroke="#3D2B1F" strokeWidth="1.5" />
          {/* Flow indicator arrow */}
          <polygon points="55,8 58,14 55,12 52,14" fill="#3D2B1F" />
          {/* Needle */}
          <line x1="55" y1="22" x2="68" y2="12" stroke="#8B0000" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="55" cy="22" r="4" fill="#3D2B1F" />
          <circle cx="55" cy="22" r="2" fill="#B8860B" />
          {/* Label */}
          <text x="55" y="34" fontSize="6" fill="#3D2B1F" textAnchor="middle" fontFamily="Georgia, serif">GPM</text>
        </g>

        {/* EXTREME GEAR - 14px with 6 teeth (tiny) at y=185 - BACK LAYER */}
        <g transform="translate(68, 180)" opacity="0.7">
          <circle cx="7" cy="7" r="7" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="1.5" />
          {/* 6 teeth */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <rect
              key={`tinyGear-${i}`}
              x="6" y="-1" width="2" height="3"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 7 7)`}
              rx="0.5"
            />
          ))}
          <circle cx="7" cy="7" r="4" fill="#2D1F14" stroke="#8B6914" strokeWidth="1" />
          <circle cx="7" cy="7" r="2" fill={`url(#rivetGradient-${side})`} />
        </g>

        {/* EXTREME GEAR - 50px with 16 teeth (large) at y=290 - FRONT LAYER */}
        <g transform="translate(40, 285)" opacity="1.0">
          <circle cx="25" cy="25" r="25" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="3" />
          {/* 16 teeth */}
          {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle, i) => (
            <rect
              key={`largeGear-${i}`}
              x="23" y="-4" width="4" height="8"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 25 25)`}
              rx="1"
            />
          ))}
          <circle cx="25" cy="25" r="16" fill="#2D1F14" stroke="#8B6914" strokeWidth="2" />
          <circle cx="25" cy="25" r="8" fill={`url(#rivetGradient-${side})`} />
          {/* Spokes */}
          <line x1="25" y1="10" x2="25" y2="40" stroke="#6B4E11" strokeWidth="3" />
          <line x1="10" y1="25" x2="40" y2="25" stroke="#6B4E11" strokeWidth="3" />
          <line x1="14" y1="14" x2="36" y2="36" stroke="#6B4E11" strokeWidth="2.5" />
          <line x1="36" y1="14" x2="14" y2="36" stroke="#6B4E11" strokeWidth="2.5" />
        </g>

        {/* INTERLOCKING GEAR PAIR 1 at y=488 */}
        {/* Back gear (opacity 0.7) */}
        <g transform="translate(62, 480)" opacity="0.7">
          <circle cx="18" cy="18" r="18" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((angle, i) => (
            <rect
              key={`interGear1a-${i}`}
              x="16" y="-3" width="4" height="6"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 18 18)`}
              rx="1"
            />
          ))}
          <circle cx="18" cy="18" r="10" fill="#2D1F14" stroke="#8B6914" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="5" fill={`url(#rivetGradient-${side})`} />
        </g>
        {/* Front gear (opacity 1.0) - meshed */}
        <g transform="translate(46, 500)" opacity="1.0">
          <circle cx="12" cy="12" r="12" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <rect
              key={`interGear1b-${i}`}
              x="10" y="-2" width="4" height="5"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 12 12)`}
              rx="1"
            />
          ))}
          <circle cx="12" cy="12" r="6" fill="#2D1F14" stroke="#8B6914" strokeWidth="1" />
          <circle cx="12" cy="12" r="3" fill={`url(#rivetGradient-${side})`} />
        </g>

        {/* INTERLOCKING GEAR PAIR 2 at y=650 */}
        {/* Back gear */}
        <g transform="translate(54, 645)" opacity="0.7">
          <circle cx="21" cy="21" r="21" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle, i) => (
            <rect
              key={`interGear2a-${i}`}
              x="19" y="-3" width="4" height="6"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 21 21)`}
              rx="1"
            />
          ))}
          <circle cx="21" cy="21" r="12" fill="#2D1F14" stroke="#8B6914" strokeWidth="1.5" />
          <circle cx="21" cy="21" r="6" fill={`url(#rivetGradient-${side})`} />
        </g>
        {/* Front gear - meshed */}
        <g transform="translate(38, 668)" opacity="1.0">
          <circle cx="14" cy="14" r="14" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2" />
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((angle, i) => (
            <rect
              key={`interGear2b-${i}`}
              x="12" y="-2" width="4" height="5"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 14 14)`}
              rx="1"
            />
          ))}
          <circle cx="14" cy="14" r="8" fill="#2D1F14" stroke="#8B6914" strokeWidth="1" />
          <circle cx="14" cy="14" r="4" fill={`url(#rivetGradient-${side})`} />
        </g>

        {/* GEAR at y=42px - 42px with 14 teeth */}
        <g transform="translate(48, 38)">
          <circle cx="21" cy="21" r="21" fill={`url(#jointGradient-${side})`} stroke="#5A3D0A" strokeWidth="2.5" />
          {[0, 25.7, 51.4, 77.1, 102.8, 128.5, 154.2, 180, 205.7, 231.4, 257.1, 282.8, 308.5, 334.2].map((angle, i) => (
            <rect
              key={`gear42-${i}`}
              x="19" y="-3" width="4" height="7"
              fill={`url(#jointGradient-${side})`}
              transform={`rotate(${angle} 21 21)`}
              rx="1"
            />
          ))}
          <circle cx="21" cy="21" r="13" fill="#2D1F14" stroke="#8B6914" strokeWidth="2" />
          <circle cx="21" cy="21" r="6.5" fill={`url(#rivetGradient-${side})`} />
          {/* Spokes */}
          <line x1="21" y1="8" x2="21" y2="34" stroke="#6B4E11" strokeWidth="2.5" />
          <line x1="8" y1="21" x2="34" y2="21" stroke="#6B4E11" strokeWidth="2.5" />
          <line x1="11" y1="11" x2="31" y2="31" stroke="#6B4E11" strokeWidth="2" />
          <line x1="31" y1="11" x2="11" y2="31" stroke="#6B4E11" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

// Standalone pressure gauge component
export function PressureGauge({ className = "", size = 80 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
    >
      <defs>
        <linearGradient id="gaugeRimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C252" />
          <stop offset="30%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#6B4E11" />
        </linearGradient>
        <radialGradient id="gaugeFaceGradient" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFEF0" />
          <stop offset="100%" stopColor="#F5E6C8" />
        </radialGradient>
      </defs>

      {/* Outer rim - enhanced */}
      <circle cx="40" cy="40" r="38" fill="url(#gaugeRimGradient)" stroke="#5A3D0A" strokeWidth="2" />
      {/* Inner rim */}
      <circle cx="40" cy="40" r="32" fill="#1a1a1a" />
      {/* Gauge face */}
      <circle cx="40" cy="40" r="28" fill="url(#gaugeFaceGradient)" />

      {/* Tick marks */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270].map((angle, i) => {
        const rad = (angle - 135) * (Math.PI / 180);
        const x1 = 40 + 24 * Math.cos(rad);
        const y1 = 40 + 24 * Math.sin(rad);
        const x2 = 40 + 20 * Math.cos(rad);
        const y2 = 40 + 20 * Math.sin(rad);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#3D2B1F"
            strokeWidth={i % 3 === 0 ? 2 : 1}
          />
        );
      })}

      {/* Needle */}
      <line x1="40" y1="40" x2="58" y2="28" stroke="#8B0000" strokeWidth="2" strokeLinecap="round" />
      {/* Center cap */}
      <circle cx="40" cy="40" r="4" fill="#3D2B1F" />
      <circle cx="40" cy="40" r="2" fill="#B8860B" />

      {/* Labels */}
      <text x="40" y="55" fontSize="8" fill="#3D2B1F" textAnchor="middle" fontFamily="Georgia, serif">PSI</text>
      <text x="22" y="50" fontSize="5" fill="#6B5744" textAnchor="middle" fontFamily="Georgia, serif">0</text>
      <text x="58" y="50" fontSize="5" fill="#6B5744" textAnchor="middle" fontFamily="Georgia, serif">100</text>
    </svg>
  );
}

// Valve Wheel standalone component
export function ValveWheel({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <defs>
        <linearGradient id="valveWheelStandalone" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C252" />
          <stop offset="30%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#6B4E11" />
        </linearGradient>
        <radialGradient id="valveHubGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#5A3D0A" />
        </radialGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="20" cy="20" r="18" fill="none" stroke="url(#valveWheelStandalone)" strokeWidth="4" />
      {/* Hub */}
      <circle cx="20" cy="20" r="6" fill="url(#valveHubGrad)" stroke="#5A3D0A" strokeWidth="1" />
      <circle cx="20" cy="20" r="2" fill="#1a1a1a" />
      {/* 8 Spokes */}
      <line x1="20" y1="4" x2="20" y2="36" stroke="#8B6914" strokeWidth="2.5" />
      <line x1="4" y1="20" x2="36" y2="20" stroke="#8B6914" strokeWidth="2.5" />
      <line x1="8" y1="8" x2="32" y2="32" stroke="#8B6914" strokeWidth="2" />
      <line x1="32" y1="8" x2="8" y2="32" stroke="#8B6914" strokeWidth="2" />
    </svg>
  );
}
