import { TREAT_SIZE, CAT_SIZE, BONE_SIZE, POWERUP_SIZE, TREAT_POINTS, CAT_POINTS, BONE_POINTS } from './constants';

abstract class Collectible {
  public x: number;
  public y: number;
  public size: number;
  public points: number;
  protected rotation = 0;
  protected bobOffset = 0;

  constructor(size: number, points: number, canvasWidth: number, canvasHeight: number) {
    this.size = size;
    this.points = points;
    this.x = Math.random() * (canvasWidth - size) + size / 2;
    this.y = Math.random() * (canvasHeight - size) + size / 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.bobOffset = Math.random() * Math.PI * 2;
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;
  
  update?(deltaTime: number, canvasWidth: number, canvasHeight: number): void;
  
  protected drawShadow(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + this.size / 2 + 2, this.size / 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Treat extends Collectible {
  constructor(canvasWidth: number, canvasHeight: number) {
    super(TREAT_SIZE, TREAT_POINTS, canvasWidth, canvasHeight);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw shadow
    this.drawShadow(ctx);
    
    // Animate bobbing
    const bob = Math.sin(Date.now() / 500 + this.bobOffset) * 2;
    const y = this.y + bob;
    
    // Rotate slowly
    this.rotation += 0.02;
    
    ctx.translate(this.x, y);
    ctx.rotate(this.rotation);
    
    // Draw bone-shaped treat with colorful gradient
    const gradient = ctx.createLinearGradient(-this.size / 2, -this.size / 2, this.size / 2, this.size / 2);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.3, '#FFA500');
    gradient.addColorStop(0.6, '#FF6347');
    gradient.addColorStop(1, '#FF1493');
    
    ctx.fillStyle = gradient;
    
    // Bone shape
    ctx.beginPath();
    // Left circles
    ctx.arc(-this.size / 3, -this.size / 4, this.size / 4, 0, Math.PI * 2);
    ctx.arc(-this.size / 3, this.size / 4, this.size / 4, 0, Math.PI * 2);
    // Right circles
    ctx.arc(this.size / 3, -this.size / 4, this.size / 4, 0, Math.PI * 2);
    ctx.arc(this.size / 3, this.size / 4, this.size / 4, 0, Math.PI * 2);
    // Center
    ctx.fillRect(-this.size / 3, -this.size / 4, this.size * 2 / 3, this.size / 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-this.size / 4, -this.size / 4, this.size / 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

export class Cat extends Collectible {
  private tailSwish = 0;
  private blinkTimer = 0;
  private pawAnimation = 0;
  private whiskerTwitch = 0;
  private speedX: number;
  private speedY: number;
  private targetX: number;
  private targetY: number;
  private moveTimer = 0;
  private direction = 0;
  private meowTimer = 0;
  
  constructor(canvasWidth: number, canvasHeight: number) {
    super(CAT_SIZE, CAT_POINTS, canvasWidth, canvasHeight);
    this.blinkTimer = Math.random() * 3;
    this.meowTimer = Math.random() * 10; // Random initial meow delay
    // Start with random movement
    this.direction = Math.random() * Math.PI * 2;
    const speed = 100; // Always moving at this speed
    this.speedX = Math.cos(this.direction) * speed;
    this.speedY = Math.sin(this.direction) * speed;
    this.targetX = this.x;
    this.targetY = this.y;
    this.moveTimer = 1 + Math.random() * 2; // Change direction every 1-3 seconds
  }

  update(deltaTime: number, canvasWidth: number, canvasHeight: number) {
    // Update meow timer
    this.meowTimer -= deltaTime;
    
    // Cats continuously prowl around
    this.moveTimer -= deltaTime;
    
    if (this.moveTimer <= 0) {
      // Change direction
      this.moveTimer = 1 + Math.random() * 2;
      
      // 70% chance to pick a new random direction
      // 30% chance to make a sharp turn
      if (Math.random() < 0.7) {
        this.direction = Math.random() * Math.PI * 2;
      } else {
        this.direction += (Math.random() - 0.5) * Math.PI; // Turn up to 90 degrees
      }
      
      const speed = 80 + Math.random() * 40; // Variable speed 80-120 pixels/second
      this.speedX = Math.cos(this.direction) * speed;
      this.speedY = Math.sin(this.direction) * speed;
    }
    
    // Update position
    this.x += this.speedX * deltaTime;
    this.y += this.speedY * deltaTime;
    
    // Bounce off edges
    if (this.x <= this.size / 2 || this.x >= canvasWidth - this.size / 2) {
      this.speedX = -this.speedX;
      this.direction = Math.atan2(this.speedY, this.speedX);
      this.x = Math.max(this.size / 2, Math.min(canvasWidth - this.size / 2, this.x));
    }
    if (this.y <= this.size / 2 || this.y >= canvasHeight - this.size / 2) {
      this.speedY = -this.speedY;
      this.direction = Math.atan2(this.speedY, this.speedX);
      this.y = Math.max(this.size / 2, Math.min(canvasHeight - this.size / 2, this.y));
    }
    
    // Update animations
    this.rotation += deltaTime * 0.5;
    this.pawAnimation += deltaTime * 8; // Faster paw animation
  }
  
  shouldMeow(): boolean {
    if (this.meowTimer <= 0) {
      this.meowTimer = 8 + Math.random() * 12; // Meow every 8-20 seconds
      return true;
    }
    return false;
  }
  
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Update visual animations
    this.tailSwish = Math.sin(Date.now() / 300) * 0.4;
    this.blinkTimer = (this.blinkTimer + 0.016) % 4;
    this.whiskerTwitch = Math.sin(Date.now() / 200) * 2;
    
    // Draw shadow
    this.drawShadow(ctx);
    
    // Animate bobbing (always moving)
    const bob = Math.sin(Date.now() / 300 + this.bobOffset) * 3;
    const y = this.y + bob;
    
    // Draw realistic cat with gradient
    const bodyGradient = ctx.createRadialGradient(
      this.x - this.size / 4,
      y - this.size / 4,
      0,
      this.x,
      y,
      this.size / 2
    );
    // Realistic cat colors - tabby orange
    bodyGradient.addColorStop(0, '#FF8C00');
    bodyGradient.addColorStop(0.5, '#FF6347');
    bodyGradient.addColorStop(0.8, '#CD853F');
    bodyGradient.addColorStop(1, '#8B4513');
    
    // Draw tail first (behind body) - points opposite to movement
    ctx.save();
    ctx.translate(this.x, y);
    const moveAngle = Math.atan2(-this.speedY, -this.speedX);
    ctx.rotate(this.tailSwish + moveAngle);
    
    const tailGradient = ctx.createLinearGradient(-this.size / 2, 0, -this.size, 0);
    tailGradient.addColorStop(0, '#FF69B4');
    tailGradient.addColorStop(0.5, '#FFD700');
    tailGradient.addColorStop(1, '#9370DB');
    
    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    ctx.moveTo(-this.size / 2 + 5, 0);
    ctx.quadraticCurveTo(
      -this.size * 0.8, -this.size * 0.3,
      -this.size, -this.size * 0.4
    );
    ctx.quadraticCurveTo(
      -this.size * 0.9, -this.size * 0.3,
      -this.size / 2 + 5, 5
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Body (rounder and fluffier)
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(this.x, y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Lighter chest/belly area
    ctx.fillStyle = 'rgba(255, 248, 220, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, y + this.size / 4, this.size / 3, this.size / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Realistic tabby stripes
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 3;
    
    // M-shaped forehead marking
    ctx.beginPath();
    ctx.moveTo(this.x - 10, y - this.size / 3);
    ctx.lineTo(this.x - 5, y - this.size / 2 + 5);
    ctx.lineTo(this.x, y - this.size / 3);
    ctx.lineTo(this.x + 5, y - this.size / 2 + 5);
    ctx.lineTo(this.x + 10, y - this.size / 3);
    ctx.stroke();
    
    // Body stripes (curved)
    for (let i = -2; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(this.x - this.size / 2, y + i * 6);
      ctx.quadraticCurveTo(
        this.x, y + i * 6 + Math.sin(i) * 3,
        this.x + this.size / 2, y + i * 6
      );
      ctx.stroke();
    }
    
    // Realistic triangular ears
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    // Left ear
    ctx.moveTo(this.x - this.size / 3, y - this.size / 3);
    ctx.lineTo(this.x - this.size / 2.5, y - this.size / 1.8);
    ctx.lineTo(this.x - this.size / 6, y - this.size / 2.5);
    ctx.closePath();
    // Right ear
    ctx.moveTo(this.x + this.size / 3, y - this.size / 3);
    ctx.lineTo(this.x + this.size / 2.5, y - this.size / 1.8);
    ctx.lineTo(this.x + this.size / 6, y - this.size / 2.5);
    ctx.closePath();
    ctx.fill();
    
    // Ear outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Inner ears (pink)
    ctx.fillStyle = '#FFB6C1';
    ctx.beginPath();
    ctx.moveTo(this.x - this.size / 3 + 4, y - this.size / 3);
    ctx.lineTo(this.x - this.size / 2.5 + 6, y - this.size / 1.8 + 4);
    ctx.lineTo(this.x - this.size / 6 - 2, y - this.size / 2.5 + 4);
    ctx.closePath();
    ctx.moveTo(this.x + this.size / 3 - 4, y - this.size / 3);
    ctx.lineTo(this.x + this.size / 2.5 - 6, y - this.size / 1.8 + 4);
    ctx.lineTo(this.x + this.size / 6 + 2, y - this.size / 2.5 + 4);
    ctx.closePath();
    ctx.fill();
    
    // Draw realistic paws (always animated since always moving)
    const pawOffset = Math.sin(this.pawAnimation) * 4; // Very visible animation
    
    ctx.fillStyle = '#8B4513';
    // Front paws
    ctx.beginPath();
    ctx.ellipse(this.x - 10, y + this.size / 3 + pawOffset, 5, 7, -0.1, 0, Math.PI * 2);
    ctx.ellipse(this.x + 10, y + this.size / 3 - pawOffset, 5, 7, 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Small paw pads
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(this.x - 10, y + this.size / 3 + 2 + pawOffset, 1.5, 0, Math.PI * 2);
    ctx.arc(this.x + 10, y + this.size / 3 + 2 - pawOffset, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes with blinking
    const isBlinking = this.blinkTimer > 3.8;
    
    if (isBlinking) {
      // Closed eyes (happy blink)
      ctx.strokeStyle = '#2C1810';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x - 6, y - 2, 4, 0, Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x + 6, y - 2, 4, 0, Math.PI);
      ctx.stroke();
    } else {
      // Realistic cat eyes - almond shaped
      // Green/yellow cat eyes
      const eyeGradient = ctx.createRadialGradient(
        this.x - 8, y - 2, 0,
        this.x - 8, y - 2, 5
      );
      eyeGradient.addColorStop(0, '#90EE90');
      eyeGradient.addColorStop(0.5, '#32CD32');
      eyeGradient.addColorStop(1, '#228B22');
      
      ctx.fillStyle = eyeGradient;
      
      // Almond shaped eyes
      ctx.beginPath();
      ctx.ellipse(this.x - 8, y - 2, 6, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();
      
      const eyeGradient2 = ctx.createRadialGradient(
        this.x + 8, y - 2, 0,
        this.x + 8, y - 2, 5
      );
      eyeGradient2.addColorStop(0, '#90EE90');
      eyeGradient2.addColorStop(0.5, '#32CD32');
      eyeGradient2.addColorStop(1, '#228B22');
      
      ctx.fillStyle = eyeGradient2;
      ctx.beginPath();
      ctx.ellipse(this.x + 8, y - 2, 6, 4, 0.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Vertical slit pupils
      const lookX = Math.sin(Date.now() / 1000) * 1;
      
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.ellipse(this.x - 8 + lookX, y - 2, 1, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(this.x + 8 + lookX, y - 2, 1, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(this.x - 6, y - 3, 1.5, 0, Math.PI * 2);
      ctx.arc(this.x + 10, y - 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Realistic pink triangle nose
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.moveTo(this.x, y + 1);
    ctx.lineTo(this.x - 3, y + 4);
    ctx.lineTo(this.x + 3, y + 4);
    ctx.closePath();
    ctx.fill();
    
    // Nose outline
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Cute mouth
    ctx.strokeStyle = '#2C1810';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x - 3, y + 5, 3, 0, Math.PI * 0.8);
    ctx.arc(this.x + 3, y + 5, 3, Math.PI * 0.2, Math.PI);
    ctx.stroke();
    
    // Long realistic whiskers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Left whiskers
    ctx.moveTo(this.x - 12, y);
    ctx.quadraticCurveTo(this.x - 20, y - 1, this.x - 28, y - 2 + this.whiskerTwitch);
    ctx.moveTo(this.x - 12, y + 2);
    ctx.quadraticCurveTo(this.x - 20, y + 2, this.x - 28, y + 2);
    ctx.moveTo(this.x - 12, y + 4);
    ctx.quadraticCurveTo(this.x - 20, y + 5, this.x - 28, y + 6 - this.whiskerTwitch);
    // Right whiskers
    ctx.moveTo(this.x + 12, y);
    ctx.quadraticCurveTo(this.x + 20, y - 1, this.x + 28, y - 2 + this.whiskerTwitch);
    ctx.moveTo(this.x + 12, y + 2);
    ctx.quadraticCurveTo(this.x + 20, y + 2, this.x + 28, y + 2);
    ctx.moveTo(this.x + 12, y + 4);
    ctx.quadraticCurveTo(this.x + 20, y + 5, this.x + 28, y + 6 - this.whiskerTwitch);
    ctx.stroke();
    
    // Remove blush marks for realism
    
    // Remove sparkle effect for realism
    
    // Motion trail behind cat
    ctx.fillStyle = 'rgba(139, 69, 19, 0.15)';
    for (let i = 1; i <= 4; i++) {
      const offsetX = -this.speedX * 0.08 * i;
      const offsetY = -this.speedY * 0.08 * i;
      const size = 5 - i;
      ctx.beginPath();
      ctx.arc(this.x + offsetX, y + this.size / 2 + offsetY, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}

export class Bone extends Collectible {
  constructor(canvasWidth: number, canvasHeight: number) {
    super(BONE_SIZE, BONE_POINTS, canvasWidth, canvasHeight);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw shadow
    this.drawShadow(ctx);
    
    // Animate gentle floating
    const float = Math.sin(Date.now() / 600 + this.bobOffset) * 3;
    const y = this.y + float;
    
    // Slight rotation
    this.rotation += 0.01;
    
    ctx.translate(this.x, y);
    ctx.rotate(this.rotation);
    
    // Draw large bone with gradient
    const gradient = ctx.createLinearGradient(-this.size / 2, -this.size / 2, this.size / 2, this.size / 2);
    gradient.addColorStop(0, '#FFFACD');
    gradient.addColorStop(0.3, '#F5DEB3');
    gradient.addColorStop(0.7, '#DEB887');
    gradient.addColorStop(1, '#D2B48C');
    
    ctx.fillStyle = gradient;
    
    // Bone shape (larger)
    const scale = 1.2;
    ctx.beginPath();
    // Left circles
    ctx.arc(-this.size / 2 * scale, -this.size / 3 * scale, this.size / 3 * scale, 0, Math.PI * 2);
    ctx.arc(-this.size / 2 * scale, this.size / 3 * scale, this.size / 3 * scale, 0, Math.PI * 2);
    // Right circles
    ctx.arc(this.size / 2 * scale, -this.size / 3 * scale, this.size / 3 * scale, 0, Math.PI * 2);
    ctx.arc(this.size / 2 * scale, this.size / 3 * scale, this.size / 3 * scale, 0, Math.PI * 2);
    // Center
    ctx.fillRect(-this.size / 2 * scale, -this.size / 4 * scale, this.size * scale, this.size / 2 * scale);
    ctx.fill();
    
    // Add shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(-this.size / 3 * scale, -this.size / 3 * scale, this.size / 6 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Add sparkle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const sparkleTime = Date.now() / 200;
    const sparkleX = Math.cos(sparkleTime) * this.size / 2;
    const sparkleY = Math.sin(sparkleTime) * this.size / 3;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

export class SpeedPowerUp extends Collectible {
  constructor(canvasWidth: number, canvasHeight: number) {
    super(POWERUP_SIZE, 0, canvasWidth, canvasHeight); // 0 points, just gives speed boost
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw shadow
    this.drawShadow(ctx);
    
    // Pulsing animation
    const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;
    const y = this.y + Math.sin(Date.now() / 400 + this.bobOffset) * 4;
    
    ctx.translate(this.x, y);
    ctx.scale(pulse, pulse);
    
    // Lightning bolt shape
    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, this.size);
    gradient.addColorStop(0, '#FFFF00');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#FFA500');
    
    ctx.fillStyle = gradient;
    
    // Draw lightning bolt
    ctx.beginPath();
    ctx.moveTo(-this.size/3, -this.size/2);
    ctx.lineTo(this.size/6, -this.size/6);
    ctx.lineTo(-this.size/6, -this.size/6);
    ctx.lineTo(this.size/3, this.size/2);
    ctx.lineTo(0, 0);
    ctx.lineTo(this.size/6, 0);
    ctx.closePath();
    ctx.fill();
    
    // Electric glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FFFF00';
    ctx.fill();
    
    // Sparks around the power-up
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 4; i++) {
      const angle = (Date.now() / 100 + i * Math.PI / 2) % (Math.PI * 2);
      const sparkX = Math.cos(angle) * (this.size + 5);
      const sparkY = Math.sin(angle) * (this.size + 5);
      
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
}