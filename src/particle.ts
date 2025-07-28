export class Particle {
  private x: number;
  private y: number;
  private vx: number;
  private vy: number;
  private life: number;
  private maxLife: number;
  private color: string;
  private size: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 200;
    this.vy = -Math.random() * 200 - 50;
    this.life = 1;
    this.maxLife = 1;
    this.color = color;
    this.size = Math.random() * 4 + 2;
  }

  update(deltaTime: number): boolean {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vy += 300 * deltaTime; // gravity
    this.life -= deltaTime * 2;
    
    return this.life > 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    const alpha = Math.max(0, this.life);
    ctx.globalAlpha = alpha;
    
    // Glow effect
    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(this.x - this.size * 2, this.y - this.size * 2, this.size * 4, this.size * 4);
    
    // Core particle
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * (0.5 + this.life * 0.5), 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}