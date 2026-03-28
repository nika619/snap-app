import { useRef, useEffect, useCallback } from 'react';

/* ──────────────────────────────────────────────
   TILT CARD — 3D parallax tilt on hover
   Makes step cards feel alive and interactive
   ────────────────────────────────────────────── */

export default function TiltCard({ children, className = '', glowColor = '#F97316' }) {
  const cardRef = useRef(null);
  const glowRef = useRef(null);
  const bounds = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Tilt amount (max 12 degrees)
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;

    // Move the glow to follow cursor
    if (glow) {
      glow.style.opacity = '1';
      glow.style.background = `radial-gradient(circle at ${x}px ${y}px, ${glowColor}20 0%, transparent 70%)`;
    }
  }, [glowColor]);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (card) {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
    if (glow) {
      glow.style.opacity = '0';
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className={`tilt-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={glowRef} className="tilt-card-glow" />
      {children}
    </div>
  );
}
