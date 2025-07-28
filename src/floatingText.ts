export class FloatingText {
  private x: number;
  private y: number;
  private text: string;
  private life: number;
  private color: string;
  private size: number;

  constructor(x: number, y: number, text: string, color: string = '#FFFFFF', size: number = 24) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.life = 1.5;
    this.color = color;
    this.size = size;
  }

  update(deltaTime: number): boolean {
    this.y -= 50 * deltaTime;
    this.life -= deltaTime;
    return this.life > 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    const alpha = Math.min(1, this.life);
    ctx.globalAlpha = alpha;
    
    // Shadow
    ctx.font = `bold ${this.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(this.text, this.x + 2, this.y + 2);
    
    // Main text
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x, this.y);
    
    ctx.restore();
  }
}