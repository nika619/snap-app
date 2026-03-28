import { useEffect, useRef, useCallback } from 'react';

/* ──────────────────────────────────────────────
   PARTICLE BURST — Click anywhere to spawn
   physics-based particle explosions
   ────────────────────────────────────────────── */

const COLORS = [
  '#F97316', '#FACC15', '#FDE047', '#D946EF',
  '#FB923C', '#EAB308', '#F0ABFC', '#FEF08A',
  '#ff6e84', '#34d399'
];

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1;
    this.decay = Math.random() * 0.02 + 0.015;
    this.size = Math.random() * 6 + 2;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.rotation = Math.random() * 360;
    this.rotSpeed = (Math.random() - 0.5) * 10;
    // Star or circle
    this.shape = Math.random() > 0.6 ? 'star' : 'circle';
    this.gravity = 0.06;
    this.friction = 0.98;
  }

  update() {
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.rotation += this.rotSpeed;
    this.size *= 0.995;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);

    if (this.shape === 'star') {
      ctx.fillStyle = this.color;
      this.drawStar(ctx, 0, 0, 5, this.size, this.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.fill();
    }
    ctx.restore();
  }

  drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }
}

export default function ParticleBurst() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  const spawnBurst = useCallback((x, y, count = 20) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(new Particle(x, y));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleClick = (e) => {
      // Don't fire on interactive elements
      const tag = e.target.tagName.toLowerCase();
      if (['button', 'input', 'textarea', 'select', 'a'].includes(tag)) return;
      if (e.target.closest('button, a, input, textarea, select, .glass-card')) return;
      spawnBurst(e.clientX, e.clientY, 15 + Math.floor(Math.random() * 10));
    };

    window.addEventListener('click', handleClick);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.update();
        p.draw(ctx);
      });

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animRef.current);
    };
  }, [spawnBurst]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-burst-canvas"
    />
  );
}
