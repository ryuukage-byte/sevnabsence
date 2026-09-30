import React from 'react';
import { Camera, Check, AlertTriangle, HelpCircle } from 'lucide-react';

export type MascotState = 'idle' | 'scanning' | 'validating' | 'success' | 'duplicate' | 'error';

interface MascotProps {
  state: MascotState;
  size?: number;
}

export const Mascot: React.FC<MascotProps> = ({ state, size = 130 }) => {
  return (
    <div
      className={`mascot-sticker-wrapper mascot-state-${state}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      {/* Background Soft Paper Aura Stamp */}
      <div
        className="mascot-paper-halo"
        style={{
          position: 'absolute',
          width: size * 0.95,
          height: size * 0.95,
          borderRadius: '50%',
          backgroundColor:
            state === 'success'
              ? 'rgba(124, 207, 207, 0.25)'
              : state === 'duplicate' || state === 'validating'
              ? 'rgba(255, 216, 138, 0.35)'
              : state === 'error'
              ? 'rgba(255, 191, 163, 0.35)'
              : 'rgba(245, 241, 232, 0.7)',
          border: '1.5px dashed rgba(216, 205, 190, 0.8)',
          transform: state === 'success' ? 'scale(1.08)' : 'scale(1)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />

      {/* Illustrated Koji Mascot Sticker */}
      <img
        src="/koji_mascot.png"
        alt="Koji Attendance Mascot"
        className={`mascot-sticker-img ${state === 'success' ? 'mascot-bounce' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          position: 'relative',
          zIndex: 2,
          filter:
            state === 'success'
              ? 'drop-shadow(0 10px 18px rgba(91, 78, 64, 0.22))'
              : 'drop-shadow(0 6px 12px rgba(91, 78, 64, 0.16))',
          transform:
            state === 'success'
              ? 'rotate(-2deg) scale(1.05)'
              : state === 'scanning'
              ? 'rotate(1deg)'
              : 'rotate(-1deg)',
          transition: 'transform 0.25s ease-out'
        }}
      />

      {/* Floating Status Emotion Badge (Die-Cut Mini Sticker) */}
      <div
        className="mascot-emotion-badge"
        style={{
          position: 'absolute',
          top: -4,
          right: -4,
          zIndex: 3,
          backgroundColor:
            state === 'success'
              ? '#7CCFCF'
              : state === 'scanning'
              ? '#A9D7F5'
              : state === 'validating'
              ? '#FFD88A'
              : state === 'duplicate'
              ? '#FFD88A'
              : state === 'error'
              ? '#FFBFA3'
              : '#FFFDF8',
          color:
            state === 'success' || state === 'scanning'
              ? '#244E52'
              : state === 'duplicate' || state === 'validating'
              ? '#6D4E1F'
              : '#764B3A',
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: '2.5px solid #FFFFFF',
          boxShadow: '0 3px 6px rgba(91, 78, 64, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 800,
          animation: state === 'scanning' ? 'pulse 1.5s infinite' : 'none'
        }}
      >
        {state === 'idle' && <Camera size={16} />}
        {state === 'scanning' && <Camera size={16} />}
        {state === 'validating' && <HelpCircle size={16} />}
        {state === 'success' && <Check size={18} strokeWidth={3} />}
        {state === 'duplicate' && <AlertTriangle size={16} />}
        {state === 'error' && <AlertTriangle size={16} />}
      </div>
    </div>
  );
};
