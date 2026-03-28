import { useEffect, useRef, useState, useCallback } from 'react';

/* ──────────────────────────────────────────────
   KONAMI CODE EASTER EGG
   → ↑ ↑ ↓ ↓ ← → ← → B A
   Triggers a "Matrix Rain" / "Neural Network" mode
   ────────────────────────────────────────────── */

const KONAMI = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a'
];

const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノSNAPAI01💡🧠✨⚡🔥';

class MatrixDrop {
  constructor(x, canvasHeight, fontSize) {
    this.x = x;
    this.y = Math.random() * -canvasHeight;
    this.speed = Math.random() * 3 + 2;
    this.fontSize = fontSize;
    this.chars = [];
    const len = Math.floor(Math.random() * 15) + 5;
    for (let i = 0; i < len; i++) {
      this.chars.push(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]);
    }
    this.canvasHeight = canvasHeight;
  }

  update() {
    this.y += this.speed;
    if (this.y > this.canvasHeight + this.chars.length * this.fontSize) {
      this.y = Math.random() * -500;
    }
    // Randomly swap a character for that flickering effect
    if (Math.random() > 0.95) {
      const idx = Math.floor(Math.random() * this.chars.length);
      this.chars[idx] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    }
  }

  draw(ctx) {
    this.chars.forEach((ch, i) => {
      const y = this.y + i * this.fontSize;
      const alpha = i === 0 ? 1 : Math.max(0, 1 - i * 0.07);
      const color = i === 0 ? '#F97316' : `rgba(250, 204, 21, ${alpha * 0.6})`;
      ctx.fillStyle = color;
      ctx.shadowColor = i === 0 ? '#F97316' : '#FACC15';
      ctx.shadowBlur = i === 0 ? 15 : 3;
      ctx.fillText(ch, this.x, y);
    });
  }
}

export default function KonamiEasterEgg() {
  const [active, setActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const sequenceRef = useRef([]);
  const canvasRef = useRef(null);
  const dropsRef = useRef([]);
  const animRef = useRef(null);
  const timerRef = useRef(null);

  // Listen for konami code
  useEffect(() => {
    const handleKey = (e) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      sequenceRef.current.push(key);

      // Keep only last N keys
      if (sequenceRef.current.length > KONAMI.length) {
        sequenceRef.current = sequenceRef.current.slice(-KONAMI.length);
      }

      // Check match
      if (sequenceRef.current.length === KONAMI.length &&
          sequenceRef.current.every((k, i) => k === KONAMI[i])) {
        setActive(prev => !prev);
        sequenceRef.current = [];
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Show hint after 60 seconds of idle
  useEffect(() => {
    const showHintTimer = setTimeout(() => {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 8000);
    }, 60000);
    
    return () => clearTimeout(showHintTimer);
  }, []);

  // Matrix rain animation
  useEffect(() => {
    if (!active) {
      // Clean up when deactivated
      if (animRef.current) cancelAnimationFrame(animRef.current);
      dropsRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const fontSize = 16;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Create drops
      dropsRef.current = [];
      const cols = Math.floor(canvas.width / fontSize);
      for (let i = 0; i < cols; i++) {
        if (Math.random() > 0.4) { // Not every column
          dropsRef.current.push(new MatrixDrop(i * fontSize, canvas.height, fontSize));
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

    const animate = () => {
      ctx.fillStyle = 'rgba(3, 0, 20, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      dropsRef.current.forEach(drop => {
        drop.update();
        drop.draw(ctx);
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    // Auto-dismiss after 15 seconds
    timerRef.current = setTimeout(() => setActive(false), 15000);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
      clearTimeout(timerRef.current);
    };
  }, [active]);

  return (
    <>
      {/* Matrix rain canvas */}
      {active && (
        <canvas
          ref={canvasRef}
          className="konami-canvas"
          onClick={() => setActive(false)}
        />
      )}

      {/* Activation toast */}
      {active && (
        <div className="konami-toast">
          <span className="konami-toast-icon">🧠</span>
          <span>NEURAL RAIN MODE ACTIVATED</span>
          <span className="konami-toast-sub">click anywhere or wait to dismiss</span>
        </div>
      )}

      {/* Subtle hint */}
      {showHint && !active && (
        <div className="konami-hint">
          <span>💡</span> Psst... try the Konami code
        </div>
      )}
    </>
  );
}
