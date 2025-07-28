import { PLAYER_SIZE, PLAYER_SPEED, PLAYER_BOOST_SPEED, POWERUP_DURATION, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

export class Player {
  public x: number;
  public y: number;
  public score = 0;
  private playerNumber: number;
  private color: string;
  private walkCycle = 0;
  private isMoving = false;
  private lastX: number;
  private lastY: number;
  private paws: Array<{x: number, y: number, age: number}> = [];
  private speedBoostTime = 0;
  private comboCount = 0;
  private comboTimer = 0;
  private tailWag = 0;
  private bounceOffset = 0;
  private happyTime = 0;
  private earFlop = 0;
  private rainbowTrail: Array<{x: number, y: number, age: number, size: number}> = [];
  private barkTimer = 0;

  private canvasWidth: number;
  private canvasHeight: number;

  constructor(x: number, y: number, playerNumber: number, canvasWidth: number, canvasHeight: number) {
    this.x = x;
    this.y = y;
    this.lastX = x;
    this.lastY = y;
    this.playerNumber = playerNumber;
    this.color = playerNumber === 0 ? '#8B4513' : '#D2691E';
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  update(deltaTime: number, gamepad: Gamepad) {
    const leftStickX = gamepad.axes[0];
    const leftStickY = gamepad.axes[1];
    
    const deadzone = 0.2;
    
    // Update bark timer
    if (this.barkTimer > 0) {
      this.barkTimer -= deltaTime;
    }
    
    // Update speed boost timer
    if (this.speedBoostTime > 0) {
      this.speedBoostTime -= deltaTime;
      
      // Add rainbow trail particles when boosting and moving
      if (this.isMoving && Math.random() < 0.8) {
        this.rainbowTrail.push({
          x: this.x + (Math.random() - 0.5) * 20,
          y: this.y + (Math.random() - 0.5) * 20,
          age: 0,
          size: Math.random() * 15 + 10
        });
      }
    }
    
    // Update rainbow trail
    this.rainbowTrail = this.rainbowTrail
      .map(particle => ({ ...particle, age: particle.age + deltaTime }))
      .filter(particle => particle.age < 1);
    
    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }
    
    // Update happy animation
    if (this.happyTime > 0) {
      this.happyTime -= deltaTime;
    }
    
    // Update tail wag
    this.tailWag += deltaTime * 10;
    
    // Update bounce
    this.bounceOffset = Math.sin(Date.now() / 200) * 2;
    
    // Track previous position
    this.lastX = this.x;
    this.lastY = this.y;
    
    let dx = 0;
    let dy = 0;
    
    const currentSpeed = this.speedBoostTime > 0 ? PLAYER_BOOST_SPEED : PLAYER_SPEED;
    
    if (Math.abs(leftStickX) > deadzone) {
      dx = leftStickX * currentSpeed * deltaTime;
      this.x += dx;
    }
    
    if (Math.abs(leftStickY) > deadzone) {
      dy = leftStickY * currentSpeed * deltaTime;
      this.y += dy;
    }
    
    // Check if moving
    this.isMoving = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1;
    
    if (this.isMoving) {
      this.walkCycle += deltaTime * 10;
      // Update ear flop when moving
      this.earFlop = Math.sin(this.walkCycle * 2) * 10;
      
      // Add paw prints
      if (Math.floor(this.walkCycle) % 4 === 0 && 
          this.paws.length === 0 || 
          (this.paws.length > 0 && this.paws[this.paws.length - 1].age > 0.1)) {
        
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;
        const offset = (Math.floor(this.walkCycle / 4) % 2) === 0 ? 8 : -8;
        
        this.paws.push({
          x: this.x + Math.cos(perpAngle) * offset,
          y: this.y + Math.sin(perpAngle) * offset,
          age: 0
        });
        
        // Keep only recent paw prints
        if (this.paws.length > 8) {
          this.paws.shift();
        }
      }
    }
    
    // Update paw print ages
    this.paws = this.paws.map(paw => ({
      ...paw,
      age: paw.age + deltaTime
    })).filter(paw => paw.age < 2);
    
    this.x = Math.max(PLAYER_SIZE / 2, Math.min(this.canvasWidth - PLAYER_SIZE / 2, this.x));
    this.y = Math.max(PLAYER_SIZE / 2, Math.min(this.canvasHeight - PLAYER_SIZE / 2, this.y));
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Draw rainbow trail when speed boosting
    if (this.speedBoostTime > 0) {
      this.rainbowTrail.forEach((particle, index) => {
        const alpha = Math.max(0, 1 - particle.age);
        const hue = (Date.now() / 10 + index * 30) % 360;
        
        ctx.save();
        ctx.globalAlpha = alpha * 0.6;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
        
        // Draw star-shaped particle
        const scale = 1 - particle.age * 0.5;
        ctx.translate(particle.x, particle.y);
        ctx.scale(scale, scale);
        
        // Draw star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const innerAngle = angle + Math.PI / 5;
          const outerRadius = particle.size;
          const innerRadius = particle.size * 0.5;
          
          if (i === 0) {
            ctx.moveTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
          } else {
            ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
          }
          ctx.lineTo(Math.cos(innerAngle) * innerRadius, Math.sin(innerAngle) * innerRadius);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      });
    }
    
    // Draw paw prints
    this.paws.forEach(paw => {
      const alpha = Math.max(0, 1 - paw.age / 2);
      ctx.fillStyle = `rgba(101, 67, 33, ${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(paw.x, paw.y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Small toe prints
      for (let i = 0; i < 3; i++) {
        const angle = -Math.PI / 3 + (i * Math.PI / 3);
        const toeX = paw.x + Math.cos(angle) * 4;
        const toeY = paw.y + Math.sin(angle) * 4 - 2;
        ctx.beginPath();
        ctx.arc(toeX, toeY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Add bobbing animation when walking
    const bobAmount = this.isMoving ? Math.sin(this.walkCycle * 2) * 4 : this.bounceOffset;
    const drawY = this.y + bobAmount;
    
    // Squash and stretch effect
    const stretchX = 1 + Math.sin(this.walkCycle * 4) * 0.05;
    const stretchY = 1 - Math.sin(this.walkCycle * 4) * 0.05;
    
    // Speed boost effect
    if (this.speedBoostTime > 0) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FFFF00';
      
      // Draw speed lines
      for (let i = 0; i < 5; i++) {
        const angle = (Date.now() / 50 + i * 72) % 360 * Math.PI / 180;
        const lineLength = 15 + Math.random() * 10;
        ctx.beginPath();
        ctx.moveTo(
          this.x + Math.cos(angle) * (PLAYER_SIZE / 2 + 5),
          drawY + Math.sin(angle) * (PLAYER_SIZE / 2 + 5)
        );
        ctx.lineTo(
          this.x + Math.cos(angle) * (PLAYER_SIZE / 2 + lineLength),
          drawY + Math.sin(angle) * (PLAYER_SIZE / 2 + lineLength)
        );
        ctx.stroke();
      }
      ctx.restore();
    }
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + PLAYER_SIZE / 2 + 2, PLAYER_SIZE / 2 - 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw body with gradient
    const bodyGradient = ctx.createRadialGradient(
      this.x - PLAYER_SIZE / 4, 
      drawY - PLAYER_SIZE / 4, 
      0,
      this.x, 
      drawY, 
      PLAYER_SIZE / 2
    );
    
    if (this.playerNumber === 0) {
      bodyGradient.addColorStop(0, '#CD853F');
      bodyGradient.addColorStop(0.7, '#8B4513');
      bodyGradient.addColorStop(1, '#654321');
    } else {
      bodyGradient.addColorStop(0, '#F4A460');
      bodyGradient.addColorStop(0.7, '#D2691E');
      bodyGradient.addColorStop(1, '#A0522D');
    }
    
    // Draw legs first (behind body)
    const legColor = this.playerNumber === 0 ? '#654321' : '#8B4513';
    ctx.fillStyle = legColor;
    
    // Calculate leg positions based on walk cycle
    const walkPhase = this.walkCycle * 2;
    
    // Front left leg
    const fl_offset = Math.sin(walkPhase) * 3;
    ctx.beginPath();
    ctx.ellipse(this.x - 8, drawY + 10 + fl_offset, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Front right leg
    const fr_offset = Math.sin(walkPhase + Math.PI) * 3;
    ctx.beginPath();
    ctx.ellipse(this.x + 8, drawY + 10 + fr_offset, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Back left leg
    const bl_offset = Math.sin(walkPhase + Math.PI/2) * 3;
    ctx.beginPath();
    ctx.ellipse(this.x - 8, drawY - 5 + bl_offset, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Back right leg
    const br_offset = Math.sin(walkPhase + 3*Math.PI/2) * 3;
    ctx.beginPath();
    ctx.ellipse(this.x + 8, drawY - 5 + br_offset, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Main body (more oval, realistic shape)
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(this.x, drawY, PLAYER_SIZE / 2, PLAYER_SIZE / 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle fur texture for realism
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    // Add subtle texture lines
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x1 = this.x + Math.cos(angle) * (PLAYER_SIZE / 2 - 8);
      const y1 = drawY + Math.sin(angle) * (PLAYER_SIZE / 2.2 - 8);
      const x2 = this.x + Math.cos(angle) * (PLAYER_SIZE / 2 - 4);
      const y2 = drawY + Math.sin(angle) * (PLAYER_SIZE / 2.2 - 4);
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    
    // Eyes with shine
    if (this.happyTime > 0) {
      // Happy eyes (closed/squinting)
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x - 8, drawY - 6, 6, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x + 8, drawY - 6, 6, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    } else {
      // Normal eyes
      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(this.x - 8, drawY - 6, 4, 0, Math.PI * 2);
      ctx.arc(this.x + 8, drawY - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Eye shine
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(this.x - 6, drawY - 8, 2, 0, Math.PI * 2);
      ctx.arc(this.x + 10, drawY - 8, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Realistic dog nose
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(this.x, drawY + 4, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(this.x - 1, drawY + 3, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Realistic mouth
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1.5;
    if (this.happyTime > 0) {
      // Open mouth panting
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(this.x, drawY + 8, 8, 6, 0, 0, Math.PI);
      ctx.fill();
      
      // Pink tongue
      ctx.fillStyle = '#DC143C';
      ctx.beginPath();
      ctx.ellipse(this.x, drawY + 10, 6, 8, 0, 0, Math.PI);
      ctx.fill();
      
      // Tongue center line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x, drawY + 8);
      ctx.lineTo(this.x, drawY + 16);
      ctx.stroke();
    } else {
      // Closed mouth - subtle line
      ctx.beginPath();
      ctx.moveTo(this.x - 5, drawY + 6);
      ctx.quadraticCurveTo(this.x, drawY + 8, this.x + 5, drawY + 6);
      ctx.stroke();
    }
    
    // Realistic floppy Bernedoodle ears
    const earColor = this.playerNumber === 0 ? '#654321' : '#8B4513';
    ctx.fillStyle = earColor;
    
    // Subtle ear movement
    const earBounce = this.isMoving ? Math.sin(this.walkCycle * 2) * 3 : 0;
    
    // Left ear - natural droopy shape
    ctx.save();
    ctx.translate(this.x - 18, drawY - 12);
    ctx.rotate(-0.2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-8, 10, -6, 25 + earBounce);
    ctx.quadraticCurveTo(-4, 30 + earBounce, 2, 28 + earBounce);
    ctx.quadraticCurveTo(8, 20, 8, 5);
    ctx.closePath();
    ctx.fill();
    
    // Ear inner shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.moveTo(2, 5);
    ctx.quadraticCurveTo(-2, 15, 0, 20 + earBounce);
    ctx.quadraticCurveTo(4, 15, 6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Right ear
    ctx.fillStyle = earColor;
    ctx.save();
    ctx.translate(this.x + 18, drawY - 12);
    ctx.rotate(0.2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(8, 10, 6, 25 - earBounce);
    ctx.quadraticCurveTo(4, 30 - earBounce, -2, 28 - earBounce);
    ctx.quadraticCurveTo(-8, 20, -8, 5);
    ctx.closePath();
    ctx.fill();
    
    // Ear inner shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.moveTo(-2, 5);
    ctx.quadraticCurveTo(2, 15, 0, 20 - earBounce);
    ctx.quadraticCurveTo(-4, 15, -6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Realistic fluffy tail
    const tailWagAngle = Math.sin(this.tailWag) * 0.3;
    ctx.save();
    ctx.translate(this.x, drawY);
    ctx.rotate(tailWagAngle);
    
    // Tail gradient
    const tailGradient = ctx.createLinearGradient(-PLAYER_SIZE / 2 - 20, -5, -PLAYER_SIZE / 2, 5);
    tailGradient.addColorStop(0, this.playerNumber === 0 ? '#654321' : '#8B4513');
    tailGradient.addColorStop(1, this.playerNumber === 0 ? '#8B4513' : '#D2691E');
    
    ctx.fillStyle = tailGradient;
    ctx.beginPath();
    ctx.moveTo(-PLAYER_SIZE / 2, 0);
    ctx.quadraticCurveTo(-PLAYER_SIZE / 2 - 15, -5, -PLAYER_SIZE / 2 - 20, 0);
    ctx.quadraticCurveTo(-PLAYER_SIZE / 2 - 15, 5, -PLAYER_SIZE / 2, 0);
    ctx.fill();
    ctx.restore();
    
    ctx.restore();
  }

  checkCollision(collectible: { x: number; y: number; size: number }): boolean {
    const dx = this.x - collectible.x;
    const dy = this.y - collectible.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (PLAYER_SIZE / 2 + collectible.size / 2);
  }

  addScore(points: number) {
    // Trigger happy animation
    this.happyTime = 1; // 1 second of happiness
    
    // Combo system
    if (this.comboTimer > 0) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.comboTimer = 2; // 2 seconds to keep combo
    
    // Apply combo multiplier
    const multiplier = Math.min(this.comboCount, 5); // Max 5x multiplier
    const finalPoints = points * multiplier;
    this.score += finalPoints;
    
    return { finalPoints, multiplier };
  }
  
  updateCanvasDimensions(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }
  
  activateSpeedBoost() {
    this.speedBoostTime = POWERUP_DURATION;
  }
  
  hasSpeedBoost(): boolean {
    return this.speedBoostTime > 0;
  }
  
  getComboCount(): number {
    return this.comboCount;
  }
  
  hasCombo(): boolean {
    return this.comboCount > 1;
  }
  
  shouldBark(): boolean {
    // Dogs bark occasionally when moving or when happy
    if (this.barkTimer <= 0) {
      if ((this.isMoving && Math.random() < 0.01) || // 1% chance per frame when moving
          (this.happyTime > 0 && Math.random() < 0.3)) { // 30% chance when collecting something
        this.barkTimer = 2 + Math.random() * 3; // Wait 2-5 seconds before next bark
        return true;
      }
    }
    return false;
  }
}