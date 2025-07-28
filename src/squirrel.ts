import { SQUIRREL_SIZE, SQUIRREL_POINTS } from './constants';

export class Squirrel {
  public x: number;
  public y: number;
  public size: number;
  public points: number;
  private speedX: number;
  private speedY: number;
  private targetX: number;
  private targetY: number;
  private panicTime = 0;
  private tailCurl = 0;
  private rotation = 0;
  private bobOffset = 0;
  
  constructor(canvasWidth: number, canvasHeight: number) {
    this.size = SQUIRREL_SIZE;
    this.points = SQUIRREL_POINTS;
    this.x = Math.random() * (canvasWidth - this.size) + this.size / 2;
    this.y = Math.random() * (canvasHeight - this.size) + this.size / 2;
    this.speedX = (Math.random() - 0.5) * 200;
    this.speedY = (Math.random() - 0.5) * 200;
    this.targetX = this.x;
    this.targetY = this.y;
    this.bobOffset = Math.random() * Math.PI * 2;
  }
  
  update(deltaTime: number, playerPositions: Array<{x: number, y: number}>, canvasWidth: number, canvasHeight: number) {
    // Check if any player is near
    let closestDistance = Infinity;
    let runFromX = 0;
    let runFromY = 0;
    
    playerPositions.forEach(player => {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        runFromX = player.x;
        runFromY = player.y;
      }
    });
    
    // If player is close, RUN AWAY! ZOOOM!
    if (closestDistance < 150) {
      this.panicTime = 1;
      // Run in opposite direction
      const dx = this.x - runFromX;
      const dy = this.y - runFromY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        this.speedX = (dx / dist) * 400; // Super fast!
        this.speedY = (dy / dist) * 400;
      }
    } else if (this.panicTime > 0) {
      this.panicTime -= deltaTime;
    } else {
      // Random wandering when not panicked
      if (Math.random() < 0.02) {
        this.targetX = Math.random() * canvasWidth;
        this.targetY = Math.random() * canvasHeight;
      }
      
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 10) {
        this.speedX = (dx / dist) * 100;
        this.speedY = (dy / dist) * 100;
      }
    }
    
    // Update position
    this.x += this.speedX * deltaTime;
    this.y += this.speedY * deltaTime;
    
    // Bounce off edges
    if (this.x < this.size / 2 || this.x > canvasWidth - this.size / 2) {
      this.speedX = -this.speedX;
      this.x = Math.max(this.size / 2, Math.min(canvasWidth - this.size / 2, this.x));
    }
    if (this.y < this.size / 2 || this.y > canvasHeight - this.size / 2) {
      this.speedY = -this.speedY;
      this.y = Math.max(this.size / 2, Math.min(canvasHeight - this.size / 2, this.y));
    }
    
    // Update animations
    this.rotation += deltaTime * 2;
    this.tailCurl = Math.sin(Date.now() / 100) * 0.3;
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.size / 2 + 2, this.size / 2.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    const drawX = this.x;
    const drawY = this.y + Math.sin(Date.now() / 200 + this.bobOffset) * 3;
    
    // Draw fluffy tail first
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(this.tailCurl + Math.atan2(this.speedY, this.speedX) + Math.PI);
    
    // Realistic bushy tail
    const tailGradient = ctx.createRadialGradient(-5, 0, 0, 0, 0, this.size * 0.9);
    tailGradient.addColorStop(0, '#A0522D');
    tailGradient.addColorStop(0.3, '#8B4513');
    tailGradient.addColorStop(0.7, '#654321');
    tailGradient.addColorStop(1, 'rgba(101, 67, 33, 0.4)');
    
    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    // S-curved tail shape
    ctx.moveTo(5, 0);
    ctx.quadraticCurveTo(-10, -this.size * 0.4, -this.size * 0.6, -this.size * 0.5);
    ctx.quadraticCurveTo(-this.size * 0.8, -this.size * 0.4, -this.size * 0.7, -this.size * 0.2);
    ctx.quadraticCurveTo(-this.size * 0.8, this.size * 0.2, -this.size * 0.6, this.size * 0.4);
    ctx.quadraticCurveTo(-this.size * 0.4, this.size * 0.5, 5, 5);
    ctx.closePath();
    ctx.fill();
    
    // Tail fur texture
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const offset = i * 0.15;
      ctx.beginPath();
      ctx.moveTo(-this.size * (0.2 + offset), -this.size * (0.3 - offset * 0.5));
      ctx.lineTo(-this.size * (0.3 + offset), this.size * (0.2 - offset * 0.3));
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Realistic body shape
    const bodyGradient = ctx.createRadialGradient(
      drawX - this.size / 6, drawY - this.size / 6, 0,
      drawX, drawY, this.size / 2.2
    );
    bodyGradient.addColorStop(0, '#A0522D');
    bodyGradient.addColorStop(0.5, '#8B4513');
    bodyGradient.addColorStop(1, '#654321');
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    // More elongated body
    ctx.ellipse(drawX, drawY, this.size / 2.2, this.size / 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // White/cream belly
    ctx.fillStyle = '#FAEBD7';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + this.size / 8, this.size / 3.5, this.size / 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Fur texture on body
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x1 = drawX + Math.cos(angle) * (this.size / 3);
      const y1 = drawY + Math.sin(angle) * (this.size / 3.5);
      const x2 = drawX + Math.cos(angle) * (this.size / 2.5);
      const y2 = drawY + Math.sin(angle) * (this.size / 3);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // Small front paws
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.ellipse(drawX - this.size / 5, drawY + this.size / 6, 4, 6, -0.3, 0, Math.PI * 2);
    ctx.ellipse(drawX + this.size / 5, drawY + this.size / 6, 4, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Tiny claws
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 0.5;
    for (let paw of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(drawX + paw * this.size / 5 + i * 1.5, drawY + this.size / 6 + 5);
        ctx.lineTo(drawX + paw * this.size / 5 + i * 1.5, drawY + this.size / 6 + 7);
        ctx.stroke();
      }
    }
    
    // Acorn (smaller, more realistic)
    if (!this.panicTime) {
      ctx.save();
      ctx.translate(drawX, drawY + 2);
      
      // Acorn body
      ctx.fillStyle = '#BC9A6A';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Acorn cap
      ctx.fillStyle = '#654321';
      ctx.beginPath();
      ctx.arc(0, -5, 5, Math.PI, 0);
      ctx.fill();
      
      // Cap texture
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 0.5;
      for (let i = -4; i <= 4; i += 2) {
        ctx.beginPath();
        ctx.moveTo(i, -5);
        ctx.lineTo(i, -7);
        ctx.stroke();
      }
      
      ctx.restore();
    }
    
    // Small rounded ears
    ctx.fillStyle = '#8B4513';
    // Left ear
    ctx.beginPath();
    ctx.ellipse(drawX - this.size / 4, drawY - this.size / 3, 4, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right ear
    ctx.beginPath();
    ctx.ellipse(drawX + this.size / 4, drawY - this.size / 3, 4, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner ear
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.ellipse(drawX - this.size / 4, drawY - this.size / 3, 2, 3, -0.3, 0, Math.PI * 2);
    ctx.ellipse(drawX + this.size / 4, drawY - this.size / 3, 2, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Realistic eyes (dark with shine)
    const eyeSize = this.panicTime > 0 ? 5 : 3.5;
    
    // Eye sockets
    ctx.fillStyle = '#2F1B14';
    ctx.beginPath();
    ctx.ellipse(drawX - 7, drawY - 4, eyeSize, eyeSize * 1.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(drawX + 7, drawY - 4, eyeSize, eyeSize * 1.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(drawX - 6, drawY - 5, eyeSize * 0.3, 0, Math.PI * 2);
    ctx.arc(drawX + 8, drawY - 5, eyeSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Small black nose
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + 1, 1.5, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Whiskers
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 0.5;
    for (let side of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(drawX + side * 4, drawY + i * 2);
        ctx.lineTo(drawX + side * 12, drawY + i * 2 - 1);
        ctx.stroke();
      }
    }
    
    // Panic effect - wide eyes instead of emoji
    if (this.panicTime > 0) {
      // Wider eye whites showing panic
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(drawX - 7, drawY - 6, 1, 0, Math.PI * 2);
      ctx.arc(drawX + 7, drawY - 6, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Speed lines when zooming
    if (Math.abs(this.speedX) > 200 || Math.abs(this.speedY) > 200) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      const angle = Math.atan2(this.speedY, this.speedX) + Math.PI;
      
      for (let i = 0; i < 3; i++) {
        const offset = (i - 1) * 10;
        ctx.beginPath();
        ctx.moveTo(
          drawX + Math.cos(angle) * 20 + Math.sin(angle) * offset,
          drawY + Math.sin(angle) * 20 - Math.cos(angle) * offset
        );
        ctx.lineTo(
          drawX + Math.cos(angle) * 40 + Math.sin(angle) * offset,
          drawY + Math.sin(angle) * 40 - Math.cos(angle) * offset
        );
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }
}