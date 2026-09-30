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
        {/* Soft Background Aura */}
        <circle
          cx="60"
          cy="60"
          r="54"
          fill={
            state === 'success'
              ? '#ECFDF5'
              : state === 'duplicate' || state === 'validating'
              ? '#FEF3C7'
              : state === 'error'
              ? '#FEE2E2'
              : '#F1F5F9'
          }
          className="mascot-aura"
        />

        {/* Mascot Body (Friendly Rounded Character) */}
        <rect
          x="30"
          y="35"
          width="60"
          height="62"
          rx="26"
          fill="#4F46E5"
          className="mascot-body"
        />

        {/* Cheeks */}
        <circle cx="42" cy="68" r="4.5" fill="#F472B6" opacity="0.6" />
        <circle cx="78" cy="68" r="4.5" fill="#F472B6" opacity="0.6" />

        {/* Eyes based on state */}
        {state === 'idle' && (
          <>
            <circle cx="45" cy="58" r="4.5" fill="#FFFFFF" />
            <circle cx="75" cy="58" r="4.5" fill="#FFFFFF" />
            <circle cx="46.5" cy="57" r="2" fill="#0F172A" />
            <circle cx="76.5" cy="57" r="2" fill="#0F172A" />
            {/* Gentle Smile */}
            <path
              d="M54 68 C 60 74, 60 74, 66 68"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        )}

        {state === 'scanning' && (
          <>
            <circle cx="45" cy="58" r="5" fill="#6EE7B7" />
            <circle cx="75" cy="58" r="5" fill="#6EE7B7" />
            <circle cx="45" cy="58" r="2" fill="#065F46" />
            <circle cx="75" cy="58" r="2" fill="#065F46" />
            <rect x="52" y="67" width="16" height="3" rx="1.5" fill="#FFFFFF" />
          </>
        )}

        {state === 'validating' && (
          <>
            <circle cx="45" cy="58" r="3.5" fill="#FFFFFF" />
            <circle cx="75" cy="58" r="4.5" fill="#FFFFFF" />
            {/* Sparkle */}
            <path
              d="M60 48 L61 51 L64 52 L61 53 L60 56 L59 53 L56 52 L59 51 Z"
              fill="#FBBF24"
            />
            <path
              d="M55 68 Q 60 72 65 68"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        )}

        {state === 'success' && (
          <>
            {/* Happy Curved Eyes ^_^ */}
            <path
              d="M39 60 Q 45 53 51 60"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M69 60 Q 75 53 81 60"
              stroke="#FFFFFF"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Big Grin */}
            <path
              d="M52 67 Q 60 77 68 67 Z"
              fill="#FFFFFF"
            />
          </>
        )}

        {state === 'duplicate' && (
          <>
            <circle cx="45" cy="58" r="4" fill="#FFFFFF" />
            <circle cx="75" cy="58" r="4" fill="#FFFFFF" />
            <circle cx="47" cy="58" r="2" fill="#0F172A" />
            <circle cx="77" cy="58" r="2" fill="#0F172A" />
            {/* Small 'O' mouth */}
            <circle cx="60" cy="70" r="3.5" fill="#FFFFFF" />
          </>
        )}

        {state === 'error' && (
          <>
            {/* Concerned Eyes >_< */}
            <path
              d="M40 56 L50 62 M50 56 L40 62"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M70 56 L80 62 M80 56 L70 62"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Wavy Mouth */}
            <path
              d="M53 72 Q 60 68 67 72"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Small ID badge in hand */}
        <rect
          x="48"
          y="84"
          width="24"
          height="18"
          rx="4"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
        <rect x="53" y="88" width="14" height="2" rx="1" fill="#6366F1" />
        <rect x="53" y="93" width="9" height="2" rx="1" fill="#94A3B8" />
      </svg>
    </div>
  );
};
