import { useEffect, useRef, useCallback } from 'react';

/* ──────────────────────────────────────────────
   CONFETTI CANNON — Celebrates user actions
   Call trigger() to fire a burst of confetti
   ────────────────────────────────────────────── */

const SHAPES = ['rect', 'circle', 'ribbon'];
const COLORS = [
  '#F97316', '#FACC15', '#D946EF', '#FDE047',
  '#FB923C', '#EAB308', '#34d399', '#F0ABFC',
  '#ff6e84', '#FEF08A', '#FDBA74', '#C026D3'
];

class ConfettiPiece {
  constructor(canvasWidth, canvasHeight) {
    this.x = canvasWidth / 2 + (Math.random() - 0.5) * canvasWidth * 0.3;
    this.y = canvasHeight + 10;
    this.vx = (Math.random() - 0.5) * 12;
    this.vy = -(Math.random() * 15 + 10);
    this.gravity = 0.25;
    this.drag = 0.97;
    this.rotation = Math.random() * 360;
    this.rotSpeed = (Math.random() - 0.5) * 15;
    this.size = Math.random() * 8 + 3;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    this.life = 1;
    this.decay = Math.random() * 0.005 + 0.003;
    this.wobble = Math.random() * 10;
    this.wobbleSpeed = Math.random() * 0.1 + 0.05;
  }

  update() {
    this.vy += this.gravity;
    this.vx *= this.drag;
    this.vy *= this.drag;
    this.x += this.vx + Math.sin(this.wobble) * 0.5;
    this.y += this.vy;
    this.rotation += this.rotSpeed;
    this.wobble += this.wobbleSpeed;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;

    if (this.shape === 'rect') {
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ribbon / streamer
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.quadraticCurveTo(0, -this.size, this.size, 0);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default function ConfettiCannon({ trigger }) {
  const canvasRef = useRef(null);
  const piecesRef = useRef([]);
  const animRef = useRef(null);
  const isRunning = useRef(false);

  const fire = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Spawn 60 pieces
    for (let i = 0; i < 60; i++) {
      piecesRef.current.push(new ConfettiPiece(canvas.width, canvas.height));
    }

    if (!isRunning.current) {
      isRunning.current = true;
      animate();
    }
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    piecesRef.current = piecesRef.current.filter(p => p.life > 0);
    piecesRef.current.forEach(p => {
      p.update();
      p.draw(ctx);
    });

    if (piecesRef.current.length > 0) {
      animRef.current = requestAnimationFrame(animate);
    } else {
      isRunning.current = false;
    }
  }, []);

  // Expose the fire function
  useEffect(() => {
    if (trigger) {
      fire();
    }
  }, [trigger, fire]);

  // Set up canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="confetti-canvas" />
  );
}
