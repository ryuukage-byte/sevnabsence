import React from 'react';

export type MascotState = 'idle' | 'scanning' | 'validating' | 'success' | 'duplicate' | 'error';

interface MascotProps {
  state: MascotState;
  size?: number;
}

export const Mascot: React.FC<MascotProps> = ({ state, size = 110 }) => {
  return (
    <div
      className={`mascot-container mascot-${state}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mascot-svg"
      >
        {/* Soft Background Paper Aura */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill={
            state === 'success'
              ? '#D6EEED'
              : state === 'duplicate' || state === 'validating'
              ? '#FFF0D1'
              : state === 'error'
              ? '#FFE9DF'
              : '#F5F1E8'
          }
          stroke="#D8CDBE"
          strokeWidth="1.5"
          className="mascot-aura"
        />

        {/* Die-Cut White Sticker Outer Border */}
        <rect
          x="27"
          y="32"
          width="66"
          height="68"
          rx="30"
          fill="#FFFFFF"
          className="mascot-sticker-border"
        />

        {/* Mascot Body (Soft Mint #7CCFCF with Soft Cocoa Outline #8B6F5A) */}
        <rect
          x="30"
          y="35"
          width="60"
          height="62"
          rx="26"
          fill="#7CCFCF"
          stroke="#5EA9A9"
          strokeWidth="2"
          className="mascot-body"
        />

        {/* Belly Patch (Warm Ivory) */}
        <ellipse
          cx="60"
          cy="74"
          rx="18"
          ry="14"
          fill="#FFFDF8"
          opacity="0.85"
        />

        {/* Cheeks (Soft Peach #FFBFA3) */}
        <circle cx="41" cy="67" r="5" fill="#FFBFA3" />
        <circle cx="79" cy="67" r="5" fill="#FFBFA3" />

        {/* Eyes & Expressions based on state */}
        {state === 'idle' && (
          <>
            <circle cx="45" cy="56" r="4.5" fill="#393F3F" />
            <circle cx="75" cy="56" r="4.5" fill="#393F3F" />
            <circle cx="43.5" cy="54.5" r="1.5" fill="#FFFFFF" />
            <circle cx="73.5" cy="54.5" r="1.5" fill="#FFFFFF" />
            {/* Gentle Smile */}
            <path
              d="M54 67 C 60 72, 60 72, 66 67"
              stroke="#244E52"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        )}

        {state === 'scanning' && (
          <>
            <circle cx="45" cy="56" r="5" fill="#244E52" />
            <circle cx="75" cy="56" r="5" fill="#244E52" />
            <circle cx="44" cy="55" r="2" fill="#FFFFFF" />
            <circle cx="74" cy="55" r="2" fill="#FFFFFF" />
            <rect x="53" y="66" width="14" height="3" rx="1.5" fill="#244E52" />
          </>
        )}

        {state === 'validating' && (
          <>
            <circle cx="45" cy="56" r="4.5" fill="#393F3F" />
            <circle cx="75" cy="56" r="4.5" fill="#393F3F" />
            <circle cx="44" cy="54.5" r="1.5" fill="#FFFFFF" />
            <circle cx="74" cy="54.5" r="1.5" fill="#FFFFFF" />
            <path
              d="M55 67 Q 60 71 65 67"
              stroke="#244E52"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        )}

        {state === 'success' && (
          <>
            {/* Happy Curved Eyes ^_^ */}
            <path
              d="M39 58 Q 45 50 51 58"
              stroke="#244E52"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M69 58 Q 75 50 81 58"
              stroke="#244E52"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Big Grin */}
            <path
              d="M52 65 Q 60 75 68 65 Z"
              fill="#244E52"
            />
          </>
        )}

        {state === 'duplicate' && (
          <>
            <circle cx="45" cy="56" r="4" fill="#393F3F" />
            <circle cx="75" cy="56" r="4" fill="#393F3F" />
            <circle cx="44" cy="55" r="1.5" fill="#FFFFFF" />
            <circle cx="74" cy="55" r="1.5" fill="#FFFFFF" />
            {/* Small 'O' mouth */}
            <circle cx="60" cy="69" r="3.5" fill="#244E52" />
          </>
        )}

        {state === 'error' && (
          <>
            {/* Concerned Eyes >_< */}
            <path
              d="M40 54 L50 60 M50 54 L40 60"
              stroke="#393F3F"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M70 54 L80 60 M80 54 L70 60"
              stroke="#393F3F"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Wavy Mouth */}
            <path
              d="M53 71 Q 60 67 67 71"
              stroke="#393F3F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Small ID badge in hand (Scrapbook Die-Cut Polaroid Card) */}
        <rect
          x="47"
          y="82"
          width="26"
          height="20"
          rx="5"
          fill="#FFFDF8"
          stroke="#D8CDBE"
          strokeWidth="1.5"
        />
        <rect x="52" y="86" width="16" height="2.5" rx="1" fill="#7CCFCF" />
        <rect x="52" y="91" width="10" height="2" rx="1" fill="#A9D7F5" />
      </svg>
    </div>
  );
};
