import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { InputManager } from './input';
import { Player } from './player';
import { Treat, Cat, Bone, SpeedPowerUp } from './collectibles';
import { Squirrel } from './squirrel';
import { Particle } from './particle';
import { FloatingText } from './floatingText';
import { audioSystem } from './audio';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private inputManager: InputManager;
  private players: Player[] = [];
  private treats: Treat[] = [];
  private cats: Cat[] = [];
  private bones: Bone[] = [];
  private powerUps: SpeedPowerUp[] = [];
  private squirrels: Squirrel[] = [];
  private lastTime = 0;
  private grassPositions: Array<{x: number, y: number, height: number, sway: number}> = [];
  private gameTime = 30; // 30 seconds per level
  private gameState: 'start' | 'playing' | 'gameover' | 'levelcomplete' | 'winner' = 'start';
  private currentLevel = 1;
  private maxLevels = 999; // Infinite levels
  private levelScores: Array<{player1: number, player2: number}> = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private backgroundGradient: CanvasGradient | null = null;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
    
    // Set canvas size to window size (now that ctx is initialized)
    this.resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', () => this.resizeCanvas());
    
    this.inputManager = new InputManager();
    this.initializeGrass();
    this.initializePlayers();
    this.initializeCollectibles();
  }
  
  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Create background gradient for new canvas size
    this.backgroundGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    this.backgroundGradient.addColorStop(0, '#87CEEB');
    this.backgroundGradient.addColorStop(0.7, '#98D8C8');
    this.backgroundGradient.addColorStop(1, '#7CB342');
    
    // Update grass positions on resize
    this.initializeGrass();
    
    // Update player canvas dimensions
    this.players.forEach(player => {
      player.updateCanvasDimensions(this.canvas.width, this.canvas.height);
    });
  }

  private initializeGrass() {
    // Generate grass positions once
    this.grassPositions = [];
    const grassCount = Math.min(200, Math.floor((this.canvas.width * this.canvas.height) / 10000)); // Reduced density
    for (let i = 0; i < grassCount; i++) {
      this.grassPositions.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height * 0.7 + Math.random() * (this.canvas.height * 0.3),
        height: 5 + Math.random() * 10,
        sway: Math.random() * 2 - 1  // Random sway offset between -1 and 1
      });
    }
  }

  private initializePlayers() {
    this.players.push(new Player(100, 100, 0, this.canvas.width, this.canvas.height));
    this.players.push(new Player(this.canvas.width - 100, this.canvas.height - 100, 1, this.canvas.width, this.canvas.height));
  }

  private initializeCollectibles() {
    for (let i = 0; i < 5; i++) {
      this.treats.push(new Treat(this.canvas.width, this.canvas.height));
    }
    this.cats.push(new Cat(this.canvas.width, this.canvas.height));
    
    for (let i = 0; i < 2; i++) {
      this.bones.push(new Bone(this.canvas.width, this.canvas.height));
    }
    
    this.powerUps.push(new SpeedPowerUp(this.canvas.width, this.canvas.height));
    
    // Add zoomy squirrels!
    for (let i = 0; i < 2; i++) {
      this.squirrels.push(new Squirrel(this.canvas.width, this.canvas.height));
    }
  }

  start() {
    this.gameLoop(0);
  }

  private gameLoop = (currentTime: number) => {
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  private update(deltaTime: number) {
    const gamepads = this.inputManager.getGamepads();
    const buttonPressed = gamepads.some(gamepad => gamepad && gamepad.buttons[0]?.pressed);
    
    if (this.gameState === 'start') {
      if (buttonPressed) {
        this.gameState = 'playing';
        // Initialize audio on first interaction
        audioSystem.setVolume(0.7);
      }
      return;
    }
    
    if (this.gameState === 'gameover' || this.gameState === 'levelcomplete' || this.gameState === 'winner') {
      // Check for button press to continue
      if (buttonPressed) {
        if (this.gameState === 'levelcomplete') {
          this.nextLevel();
        } else {
          this.restart();
        }
      }
      return;
    }
    
    // Update game timer
    this.gameTime -= deltaTime;
    if (this.gameTime <= 0) {
      this.gameTime = 0;
      this.onLevelEnd();
    }
    
    this.players.forEach((player, index) => {
      const gamepad = gamepads[index];
      if (gamepad) {
        player.update(deltaTime, gamepad);
        
        // Check if dog should bark
        if (player.shouldBark()) {
          try {
            if (audioSystem && typeof audioSystem.playBarkSound === 'function') {
              audioSystem.playBarkSound();
            }
          } catch (e) {
            console.log('Bark sound not available');
          }
        }
      }
    });

    // Update squirrels with player positions
    const playerPositions = this.players.map(p => ({ x: p.x, y: p.y }));
    this.squirrels.forEach(squirrel => {
      squirrel.update(deltaTime, playerPositions, this.canvas.width, this.canvas.height);
    });

    // Update cats
    this.cats.forEach(cat => {
      cat.update(deltaTime, this.canvas.width, this.canvas.height);
      
      // Check if cat should meow
      if (cat && typeof cat.shouldMeow === 'function' && cat.shouldMeow()) {
        try {
          if (audioSystem && typeof audioSystem.playMeowSound === 'function') {
            audioSystem.playMeowSound();
          }
        } catch (e) {
          console.log('Meow sound not available');
        }
      }
    });

    this.checkCollisions();
    
    // Update particles
    this.particles = this.particles.filter(particle => particle.update(deltaTime));
    
    // Update floating texts
    this.floatingTexts = this.floatingTexts.filter(text => text.update(deltaTime));
  }
  
  private onLevelEnd() {
    // Store level scores
    this.levelScores.push({
      player1: this.players[0].score,
      player2: this.players[1].score
    });
    
    if (this.currentLevel >= this.maxLevels) {
      this.gameState = 'winner';
      // Safe call to audio
      try {
        if (audioSystem && typeof audioSystem.playVictoryFanfare === 'function') {
          audioSystem.playVictoryFanfare();
        }
      } catch (e) {
        console.log('Audio not available');
      }
    } else {
      this.gameState = 'levelcomplete';
      // Safe call to audio
      try {
        if (audioSystem && typeof audioSystem.playLevelCompleteSound === 'function') {
          audioSystem.playLevelCompleteSound();
        }
      } catch (e) {
        console.log('Audio not available');
      }
    }
  }
  
  private nextLevel() {
    this.currentLevel++;
    this.gameState = 'playing';
    this.gameTime = 30;
    // Keep scores cumulative
    this.treats = [];
    this.cats = [];
    this.bones = [];
    this.powerUps = [];
    this.squirrels = [];
    this.floatingTexts = [];
    this.particles = [];
    this.initializeCollectibles();
    
    // Add more collectibles for higher levels
    for (let i = 0; i < this.currentLevel - 1; i++) {
      this.treats.push(new Treat(this.canvas.width, this.canvas.height));
      if (i % 2 === 0) {
        this.cats.push(new Cat(this.canvas.width, this.canvas.height));
      }
    }
  }
  
  private restart() {
    this.gameState = 'playing';
    this.gameTime = 30;
    this.currentLevel = 1;
    this.levelScores = [];
    this.players.forEach(player => player.score = 0);
    this.treats = [];
    this.cats = [];
    this.bones = [];
    this.powerUps = [];
    this.squirrels = [];
    this.floatingTexts = [];
    this.particles = [];
    this.initializeCollectibles();
  }

  private checkCollisions() {
    this.players.forEach(player => {
      this.treats = this.treats.filter(treat => {
        if (player.checkCollision(treat)) {
          const result = player.addScore(treat.points);
          this.spawnParticles(treat.x, treat.y, '#DEB887', 10);
          
          // Play treat sound
          audioSystem.playTreatSound();
          
          // Add cute sound text
          const sounds = ['Yum!', 'Woof!', 'Tasty!', 'Nom nom!', 'Yummy!', 'CHOMP!', 'Snack attack!', '*munch munch*'];
          const sound = sounds[Math.floor(Math.random() * sounds.length)];
          this.floatingTexts.push(new FloatingText(treat.x, treat.y - 20, sound, '#FFD700', 20));
          
          // Silly random reactions
          if (Math.random() < 0.15) {
            const sillyReactions = ['BURP!', 'Excuse me!', 'More plz!', 'Is that bacon?', '😋'];
            this.floatingTexts.push(new FloatingText(
              player.x,
              player.y - 60,
              sillyReactions[Math.floor(Math.random() * sillyReactions.length)],
              '#FF69B4',
              22
            ));
          }
    
    // Occasionally play a funny extra sound
    if (Math.random() < 0.1) {
      const funnyTexts = ['BURP!', 'Hiccup!', 'Mmmmm!', 'More please!'];
      const funnyText = funnyTexts[Math.floor(Math.random() * funnyTexts.length)];
      this.floatingTexts.push(new FloatingText(
        player.x,
        player.y - 20,
        funnyText,
        '#FF69B4',
        18
      ));
    }
          
          // Show combo text if applicable
          if (result.multiplier > 1) {
            if (audioSystem && typeof audioSystem.playComboSound === 'function') {
              audioSystem.playComboSound(result.multiplier);
            }
            this.floatingTexts.push(new FloatingText(
              player.x, 
              player.y - 40, 
              `x${result.multiplier} Combo!`, 
              '#FF69B4', 
              28
            ));
          }
          
          return false;
        }
        return true;
      });

      while (this.treats.length < 5) {
        this.treats.push(new Treat(this.canvas.width, this.canvas.height));
      }

      this.cats = this.cats.filter(cat => {
        if (player.checkCollision(cat)) {
          const result = player.addScore(cat.points);
          this.spawnParticles(cat.x, cat.y, '#FFD700', 20);
          
          // Play cat sound
          audioSystem.playCatSound();
          
          // Add special cat sounds
          const catSounds = ['Meow!', 'Kitty!', 'So fluffy!', 'Purrrr!', 'Found you!', 'CAT-ASTROPHIC!', 'Meowgnificent!'];
          const sound = catSounds[Math.floor(Math.random() * catSounds.length)];
          this.floatingTexts.push(new FloatingText(cat.x, cat.y - 30, sound, '#FF1493', 28));
          
          // Dog reactions to cats
          if (Math.random() < 0.3) {
            const dogReacts = ['Friend?', 'KITTY!', 'Chase?', 'Boop the snoot!', 'Cat fren 🐶❤️🐱'];
            this.floatingTexts.push(new FloatingText(
              player.x,
              player.y - 50,
              dogReacts[Math.floor(Math.random() * dogReacts.length)],
              '#87CEEB',
              20
            ));
          }
          
          // Show combo text if applicable
          if (result.multiplier > 1) {
            if (audioSystem && typeof audioSystem.playComboSound === 'function') {
              audioSystem.playComboSound(result.multiplier);
            }
            this.floatingTexts.push(new FloatingText(
              player.x, 
              player.y - 40, 
              `x${result.multiplier} Combo!`, 
              '#FF69B4', 
              28
            ));
          }
          
          return false;
        }
        return true;
      });

      while (this.cats.length < 1) {
        this.cats.push(new Cat(this.canvas.width, this.canvas.height));
      }
      
      this.bones = this.bones.filter(bone => {
        if (player.checkCollision(bone)) {
          const result = player.addScore(bone.points);
          this.spawnParticles(bone.x, bone.y, '#F5DEB3', 15);
          
          // Play bone sound
          audioSystem.playBoneSound();
          
          // Add bone sounds
          const boneSounds = ['Crunchy!', 'My bone!', 'Chomp!', 'Delicious!', 'Gnaw gnaw!', 'CRONCH!', 'Best day ever!'];
          const sound = boneSounds[Math.floor(Math.random() * boneSounds.length)];
          this.floatingTexts.push(new FloatingText(bone.x, bone.y - 25, sound, '#8B4513', 22));
          
          // Silly size reactions
          if (Math.random() < 0.2) {
            this.floatingTexts.push(new FloatingText(
              player.x,
              player.y - 70,
              'Gonna bury this later!',
              '#D2691E',
              16
            ));
          }
          
          // Show combo text if applicable
          if (result.multiplier > 1) {
            if (audioSystem && typeof audioSystem.playComboSound === 'function') {
              audioSystem.playComboSound(result.multiplier);
            }
            this.floatingTexts.push(new FloatingText(
              player.x, 
              player.y - 40, 
              `x${result.multiplier} Combo!`, 
              '#FF69B4', 
              28
            ));
          }
          
          return false;
        }
        return true;
      });
      
      while (this.bones.length < 2) {
        this.bones.push(new Bone(this.canvas.width, this.canvas.height));
      }
      
      this.powerUps = this.powerUps.filter(powerUp => {
        if (player.checkCollision(powerUp)) {
          player.activateSpeedBoost();
          this.spawnParticles(powerUp.x, powerUp.y, '#FFFF00', 25);
          
          // Play power-up sound
          audioSystem.playPowerUpSound();
          
          // Add power-up sound
          const powerSounds = ['ZOOM!', 'So fast!', 'Wheee!', 'Speed boost!', 'NYOOOM!', 'ZOOMIES ACTIVATED!', 'I am speed!'];
          const sound = powerSounds[Math.floor(Math.random() * powerSounds.length)];
          this.floatingTexts.push(new FloatingText(powerUp.x, powerUp.y - 30, sound, '#FFFF00', 30));
          
          // Zoom trails
          for (let i = 0; i < 3; i++) {
            setTimeout(() => {
              if (this.gameState === 'playing') {
                this.floatingTexts.push(new FloatingText(
                  player.x - 40 - i * 20,
                  player.y + (Math.random() - 0.5) * 60,
                  '💨',
                  '#FFFFFF',
                  25 + i * 5
                ));
              }
            }, i * 100);
          }
          
          return false;
        }
        return true;
      });
      
      while (this.powerUps.length < 1) {
        this.powerUps.push(new SpeedPowerUp(this.canvas.width, this.canvas.height));
      }
      
      // Check squirrel collisions
      this.squirrels = this.squirrels.filter(squirrel => {
        if (player.checkCollision(squirrel)) {
          const result = player.addScore(squirrel.points);
          this.spawnParticles(squirrel.x, squirrel.y, '#8B4513', 30);
          
          // Play squirrel sound
          if (audioSystem && typeof audioSystem.playSquirrelSound === 'function') {
            audioSystem.playSquirrelSound();
          }
          
          // Squirrel reactions
          const squirrelSounds = ['CAUGHT ME!', 'NYOOM!', 'Acorn thief!', 'You\'re fast!', 'MY NUTS!', 'Squeeeeak!'];
          const sound = squirrelSounds[Math.floor(Math.random() * squirrelSounds.length)];
          this.floatingTexts.push(new FloatingText(squirrel.x, squirrel.y - 30, sound, '#8B4513', 24));
          
          // Dog reactions
          const dogReacts = ['GOT ONE!', 'Speedy boi!', 'Come back!', 'SQUIRREL!!!', 'Zoom zoom!'];
          this.floatingTexts.push(new FloatingText(
            player.x,
            player.y - 50,
            dogReacts[Math.floor(Math.random() * dogReacts.length)],
            '#FFD700',
            26
          ));
          
          // Show combo text if applicable
          if (result.multiplier > 1) {
            if (audioSystem && typeof audioSystem.playComboSound === 'function') {
              audioSystem.playComboSound(result.multiplier);
            }
            this.floatingTexts.push(new FloatingText(
              player.x, 
              player.y - 40, 
              `x${result.multiplier} Combo!`, 
              '#FF69B4', 
              28
            ));
          }
          
          return false;
        }
        return true;
      });
      
      while (this.squirrels.length < 2) {
        this.squirrels.push(new Squirrel(this.canvas.width, this.canvas.height));
      }
    });
  }
  
  private spawnParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  private render() {
    // Use cached gradient background
    if (this.backgroundGradient) {
      this.ctx.fillStyle = this.backgroundGradient;
    } else {
      this.ctx.fillStyle = '#7CB342';
    }
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Grass removed to fix flickering

    this.treats.forEach(treat => treat.draw(this.ctx));
    this.cats.forEach(cat => cat.draw(this.ctx));
    this.bones.forEach(bone => bone.draw(this.ctx));
    this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
    this.squirrels.forEach(squirrel => squirrel.draw(this.ctx));
    
    // Draw particles
    this.particles.forEach(particle => particle.draw(this.ctx));
    
    // Draw floating texts
    this.floatingTexts.forEach(text => text.draw(this.ctx));
    
    // Silly random events
    if (Math.random() < 0.003 && this.gameState === 'playing') { // Rare silly events
      const sillyEvents = [
        { text: 'SQUIRREL!!!', size: 45 },
        { text: 'Who\'s a good dog?', size: 35 },
        { text: 'I smell treats!', size: 30 },
        { text: 'Pet me!', size: 28 },
        { text: 'Walkies later?', size: 32 },
        { text: '\ud83d\udc15 WOOF! \ud83d\udc15', size: 40 }
      ];
      const event = sillyEvents[Math.floor(Math.random() * sillyEvents.length)];
      this.floatingTexts.push(new FloatingText(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        event.text,
        `hsl(${Math.random() * 360}, 100%, 50%)`,
        event.size
      ));
    }
    
    this.players.forEach(player => player.draw(this.ctx));

    if (this.gameState === 'playing') {
      this.renderUI();
    }
    
    if (this.gameState === 'start') {
      this.renderStartScreen();
    } else if (this.gameState === 'gameover') {
      this.renderGameOver();
    } else if (this.gameState === 'levelcomplete') {
      this.renderLevelComplete();
    } else if (this.gameState === 'winner') {
      this.renderWinnerScreen();
    }
  }
  
  private renderGameOver() {
    // Dark overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Game over text
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 60px Arial';
    
    // Text shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2 + 3, this.canvas.height / 2 - 47);
    
    // Main text
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 50);
    
    // Final scores
    this.ctx.font = 'bold 36px Arial';
    const winner = this.players[0].score > this.players[1].score ? 1 : 
                   this.players[1].score > this.players[0].score ? 2 : 0;
    
    // Player 1 score
    this.ctx.fillStyle = winner === 1 ? '#00FF00' : '#FFFFFF';
    this.ctx.fillText(`Player 1: ${this.players[0].score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    
    // Player 2 score
    this.ctx.fillStyle = winner === 2 ? '#00FF00' : '#FFFFFF';
    this.ctx.fillText(`Player 2: ${this.players[1].score}`, this.canvas.width / 2, this.canvas.height / 2 + 70);
    
    // Winner announcement
    if (winner > 0) {
      this.ctx.font = 'bold 40px Arial';
      this.ctx.fillStyle = '#00FF00';
      this.ctx.fillText(`Player ${winner} Wins!`, this.canvas.width / 2, this.canvas.height / 2 + 130);
    } else {
      this.ctx.font = 'bold 40px Arial';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText('It\'s a Tie!', this.canvas.width / 2, this.canvas.height / 2 + 130);
    }
    
    // Restart instruction
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText('Press A button to play again', this.canvas.width / 2, this.canvas.height / 2 + 180);
  }
  
  private renderLevelComplete() {
    const time = Date.now() / 100;
    const winner = this.players[0].score > this.players[1].score ? 0 : 
                   this.players[1].score > this.players[0].score ? 1 : -1;
    
    // Animated party background
    for (let i = 0; i < 50; i++) {
      const x = (i * 137 + time * 30) % this.canvas.width;
      const y = (Math.sin(i + time / 10) * 100 + this.canvas.height / 2 + i * 10) % this.canvas.height;
      const hue = (i * 7.2 + time * 10) % 360;
      
      this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(time / 10 + i);
      
      // Balloons
      if (i % 3 === 0) {
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 15, 20, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 20);
        this.ctx.lineTo(0, 40);
        this.ctx.stroke();
      } else {
        // Confetti
        this.ctx.fillRect(-5, -5, 10, 10);
      }
      this.ctx.restore();
    }
    
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw celebrating dogs
    const dogY = this.canvas.height / 2 + 50;
    const bounce = Math.abs(Math.sin(time / 5)) * 20;
    
    // Player 1 dog
    this.drawCelebrationDog(
      this.canvas.width / 2 - 150,
      dogY - (winner === 0 ? bounce : 0),
      0,
      winner === 0,
      time
    );
    
    // Player 2 dog
    this.drawCelebrationDog(
      this.canvas.width / 2 + 150,
      dogY - (winner === 1 ? bounce : 0),
      1,
      winner === 1,
      time
    );
    
    // Level complete text
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 60px Arial';
    
    // Rainbow text effect
    const gradient = this.ctx.createLinearGradient(
      this.canvas.width / 2 - 200, 0,
      this.canvas.width / 2 + 200, 0
    );
    gradient.addColorStop(0, '#FF0000');
    gradient.addColorStop(0.17, '#FF7F00');
    gradient.addColorStop(0.33, '#FFFF00');
    gradient.addColorStop(0.5, '#00FF00');
    gradient.addColorStop(0.67, '#0000FF');
    gradient.addColorStop(0.83, '#4B0082');
    gradient.addColorStop(1, '#9400D3');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillText(`LEVEL ${this.currentLevel} COMPLETE!`, this.canvas.width / 2, 100);
    
    // Winner announcement with crown emoji
    if (winner >= 0) {
      this.ctx.font = 'bold 40px Arial';
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText(`Player ${winner + 1} Wins! 👑`, this.canvas.width / 2, 160);
    }
    
    // Level scores
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillStyle = winner === 0 ? '#00FF00' : '#FFFFFF';
    this.ctx.fillText(`Player 1: ${this.players[0].score}`, this.canvas.width / 2 - 150, dogY + 100);
    
    this.ctx.fillStyle = winner === 1 ? '#00FF00' : '#FFFFFF';
    this.ctx.fillText(`Player 2: ${this.players[1].score}`, this.canvas.width / 2 + 150, dogY + 100);
    
    // Next level instruction
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(`Press A to start Level ${this.currentLevel + 1}`, this.canvas.width / 2, this.canvas.height - 50);
  }
  
  private drawCelebrationDog(x: number, y: number, playerNum: number, isWinner: boolean, time: number) {
    const size = 80; // Bigger celebration dogs
    const color = playerNum === 0 ? '#8B4513' : '#D2691E';
    
    // Jumping animation for winner
    const jumpHeight = isWinner ? Math.abs(Math.sin(time / 3)) * 30 : 0;
    const drawY = y - jumpHeight;
    
    // Body
    const bodyGradient = this.ctx.createRadialGradient(
      x - size / 4, drawY - size / 4, 0,
      x, drawY, size / 2
    );
    
    if (playerNum === 0) {
      bodyGradient.addColorStop(0, '#CD853F');
      bodyGradient.addColorStop(0.7, '#8B4513');
      bodyGradient.addColorStop(1, '#654321');
    } else {
      bodyGradient.addColorStop(0, '#F4A460');
      bodyGradient.addColorStop(0.7, '#D2691E');
      bodyGradient.addColorStop(1, '#A0522D');
    }
    
    this.ctx.fillStyle = bodyGradient;
    this.ctx.beginPath();
    this.ctx.arc(x, drawY, size / 2, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Happy face
    // Eyes (closed from happiness)
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(x - 15, drawY - 10, 8, Math.PI * 0.2, Math.PI * 0.8);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(x + 15, drawY - 10, 8, Math.PI * 0.2, Math.PI * 0.8);
    this.ctx.stroke();
    
    // Big smile
    this.ctx.beginPath();
    this.ctx.arc(x, drawY, 25, 0, Math.PI);
    this.ctx.stroke();
    
    // Tongue out
    this.ctx.fillStyle = '#FF69B4';
    this.ctx.beginPath();
    this.ctx.arc(x + 10, drawY + 15, 10, 0, Math.PI);
    this.ctx.fill();
    
    // Party hat if winner
    if (isWinner) {
      const hatGradient = this.ctx.createLinearGradient(
        x - 20, drawY - size / 2 - 40,
        x + 20, drawY - size / 2
      );
      hatGradient.addColorStop(0, '#FF0000');
      hatGradient.addColorStop(0.5, '#FFD700');
      hatGradient.addColorStop(1, '#FF0000');
      
      this.ctx.fillStyle = hatGradient;
      this.ctx.beginPath();
      this.ctx.moveTo(x, drawY - size / 2 - 40);
      this.ctx.lineTo(x - 20, drawY - size / 2);
      this.ctx.lineTo(x + 20, drawY - size / 2);
      this.ctx.closePath();
      this.ctx.fill();
      
      // Pom pom
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.arc(x, drawY - size / 2 - 40, 8, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Wagging tail
    const tailWag = Math.sin(time) * 0.5;
    this.ctx.save();
    this.ctx.translate(x, drawY);
    this.ctx.rotate(tailWag);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.ellipse(-size / 2 - 15, 0, 20, 10, -0.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
    
    // Paws up in celebration
    if (isWinner) {
      this.ctx.fillStyle = color;
      // Left paw up
      this.ctx.beginPath();
      this.ctx.arc(x - 20, drawY - size / 3, 10, 0, Math.PI * 2);
      this.ctx.fill();
      // Right paw up
      this.ctx.beginPath();
      this.ctx.arc(x + 20, drawY - size / 3, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Victory stars around winner
      for (let i = 0; i < 5; i++) {
        const angle = (time / 5 + i * Math.PI * 2 / 5) % (Math.PI * 2);
        const starX = x + Math.cos(angle) * (size + 20);
        const starY = drawY + Math.sin(angle) * (size + 20);
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('⭐', starX - 10, starY + 5);
      }
    }
  }
  
  private renderWinnerScreen() {
    // Calculate final winner
    const totalP1 = this.players[0].score;
    const totalP2 = this.players[1].score;
    const winner = totalP1 > totalP2 ? 1 : totalP2 > totalP1 ? 2 : 0;
    
    // Animated confetti background
    const time = Date.now() / 100;
    for (let i = 0; i < 100; i++) {
      const x = (i * 73 + time * 50) % this.canvas.width;
      const y = (Math.sin(i + time / 10) * 200 + this.canvas.height / 2 + i * 5) % this.canvas.height;
      const hue = (i * 3.6 + time * 10) % 360;
      
      this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(time / 10 + i);
      this.ctx.fillRect(-5, -5, 10, 10);
      this.ctx.restore();
    }
    
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Winner announcement
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 80px Arial';
    
    // Pulsing effect
    const pulse = Math.sin(time / 5) * 0.1 + 1;
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2 - 100);
    this.ctx.scale(pulse, pulse);
    
    if (winner > 0) {
      // Rainbow gradient for winner text
      const winnerGradient = this.ctx.createLinearGradient(-200, 0, 200, 0);
      winnerGradient.addColorStop(0, '#FF0000');
      winnerGradient.addColorStop(0.5, '#FFD700');
      winnerGradient.addColorStop(1, '#00FF00');
      
      this.ctx.fillStyle = winnerGradient;
      this.ctx.fillText(`PLAYER ${winner} WINS!`, 0, 0);
    } else {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText('IT\'S A TIE!', 0, 0);
    }
    this.ctx.restore();
    
    // Trophy emoji
    this.ctx.font = '100px Arial';
    this.ctx.fillText('🏆', this.canvas.width / 2, this.canvas.height / 2);
    
    // Final scores
    this.ctx.font = 'bold 36px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText(`Final Scores:`, this.canvas.width / 2, this.canvas.height / 2 + 80);
    
    this.ctx.fillStyle = winner === 1 ? '#00FF00' : '#FFFFFF';
    this.ctx.fillText(`Player 1: ${totalP1}`, this.canvas.width / 2, this.canvas.height / 2 + 130);
    
    this.ctx.fillStyle = winner === 2 ? '#00FF00' : '#FFFFFF';
    this.ctx.fillText(`Player 2: ${totalP2}`, this.canvas.width / 2, this.canvas.height / 2 + 180);
    
    // Play again instruction
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText('Press A button to play again', this.canvas.width / 2, this.canvas.height / 2 + 240);
  }

  private drawGrass() {
    this.ctx.save();
    
    // Set common properties once
    this.ctx.strokeStyle = '#4CAF50';
    this.ctx.lineWidth = 2;
    
    // Draw pre-generated grass blades
    const time = Date.now() / 1000;
    this.grassPositions.forEach(grass => {
      this.ctx.beginPath();
      this.ctx.moveTo(grass.x, grass.y);
      
      // Add slight sway animation using pre-generated offset
      const sway = Math.sin(time + grass.x / 100) * 2 + grass.sway;
      this.ctx.lineTo(grass.x + sway, grass.y - grass.height);
      this.ctx.stroke();
    });
    
    this.ctx.restore();
  }

  private renderUI() {
    // Draw score panels with gradient backgrounds
    this.ctx.save();
    
    // Player 1 panel
    const panel1Gradient = this.ctx.createLinearGradient(5, 5, 5, 45);
    panel1Gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    panel1Gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    this.ctx.fillStyle = panel1Gradient;
    this.ctx.fillRect(5, 5, 100, 40);
    
    // Player 2 panel
    const panel2Gradient = this.ctx.createLinearGradient(this.canvas.width - 105, 5, this.canvas.width - 105, 45);
    panel2Gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    panel2Gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    this.ctx.fillStyle = panel2Gradient;
    this.ctx.fillRect(this.canvas.width - 105, 5, 100, 40);
    
    // Draw text with shadow
    this.ctx.font = 'bold 18px Arial';
    this.ctx.textAlign = 'left';
    
    // Text shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillText(`P1: ${this.players[0].score}`, 17, 32);
    
    // Main text
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(`P1: ${this.players[0].score}`, 15, 30);
    
    // Player 2
    this.ctx.textAlign = 'right';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillText(`P2: ${this.players[1].score}`, this.canvas.width - 13, 32);
    
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(`P2: ${this.players[1].score}`, this.canvas.width - 15, 30);
    
    // Enhanced Level Display at top center
    this.renderLevelIndicator();
    
    // Timer display (moved below level indicator)
    const timerY = 80;
    const timerGradient = this.ctx.createLinearGradient(this.canvas.width / 2 - 50, timerY, this.canvas.width / 2 - 50, timerY + 40);
    timerGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    timerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    this.ctx.fillStyle = timerGradient;
    this.ctx.fillRect(this.canvas.width / 2 - 50, timerY, 100, 40);
    
    // Timer text with pulsing effect when low
    this.ctx.textAlign = 'center';
    const timeRemaining = Math.ceil(this.gameTime);
    
    if (timeRemaining <= 5) {
      // Pulsing effect for urgency
      const pulse = Math.sin(Date.now() / 100) * 0.2 + 1;
      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2, timerY + 20);
      this.ctx.scale(pulse, pulse);
      this.ctx.font = 'bold 24px Arial';
      this.ctx.fillStyle = '#FF0000';
      this.ctx.fillText(`${timeRemaining}s`, 0, 0);
      this.ctx.restore();
    } else {
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillStyle = timeRemaining > 15 ? '#00FF00' : '#FFD700';
      this.ctx.fillText(`${timeRemaining}s`, this.canvas.width / 2, timerY + 25);
    }
    
    this.ctx.textAlign = 'left';
    
    this.ctx.restore();
  }
  
  private renderLevelIndicator() {
    const centerX = this.canvas.width / 2;
    const y = 10;
    const width = 300;
    const height = 60;
    
    // Animated background based on level
    const time = Date.now() / 1000;
    const hue = (this.currentLevel * 30 + time * 50) % 360;
    
    // Outer glow effect
    this.ctx.save();
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    
    // Background panel with gradient
    const bgGradient = this.ctx.createLinearGradient(centerX - width/2, y, centerX + width/2, y + height);
    bgGradient.addColorStop(0, `hsla(${hue}, 50%, 20%, 0.9)`);
    bgGradient.addColorStop(0.5, `hsla(${hue}, 70%, 30%, 0.9)`);
    bgGradient.addColorStop(1, `hsla(${hue}, 50%, 20%, 0.9)`);
    
    this.ctx.fillStyle = bgGradient;
    this.ctx.beginPath();
    this.ctx.roundRect(centerX - width/2, y, width, height, 15);
    this.ctx.fill();
    
    // Border
    this.ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    
    this.ctx.restore();
    
    // Level text with special effects
    this.ctx.save();
    this.ctx.textAlign = 'center';
    
    // Main level text
    this.ctx.font = 'bold 32px Arial';
    
    // Create gradient for level text
    const textGradient = this.ctx.createLinearGradient(centerX - 100, y, centerX + 100, y + height);
    textGradient.addColorStop(0, '#FFFFFF');
    textGradient.addColorStop(0.5, '#FFD700');
    textGradient.addColorStop(1, '#FFFFFF');
    
    this.ctx.fillStyle = textGradient;
    this.ctx.fillText(`LEVEL ${this.currentLevel}`, centerX, y + 40);
    
    // Add stars around high levels
    if (this.currentLevel > 5) {
      const starCount = Math.min(this.currentLevel - 5, 10);
      this.ctx.font = '16px Arial';
      this.ctx.fillStyle = '#FFD700';
      
      for (let i = 0; i < starCount; i++) {
        const angle = (i / starCount) * Math.PI * 2 + time;
        const radius = 35;
        const starX = centerX + Math.cos(angle) * radius;
        const starY = y + height/2 + Math.sin(angle) * radius;
        this.ctx.fillText('⭐', starX - 8, starY + 5);
      }
    }
    
    // Progress bar to next level
    const progressBarY = y + height - 10;
    const progressBarWidth = width - 40;
    const progress = 1 - (this.gameTime / 30); // 30 seconds per level
    
    // Progress bar background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(centerX - progressBarWidth/2, progressBarY, progressBarWidth, 6);
    
    // Progress bar fill
    const progressGradient = this.ctx.createLinearGradient(
      centerX - progressBarWidth/2, progressBarY,
      centerX - progressBarWidth/2 + progressBarWidth * progress, progressBarY
    );
    progressGradient.addColorStop(0, '#00FF00');
    progressGradient.addColorStop(0.5, '#FFD700');
    progressGradient.addColorStop(1, '#FF0000');
    
    this.ctx.fillStyle = progressGradient;
    this.ctx.fillRect(centerX - progressBarWidth/2, progressBarY, progressBarWidth * progress, 6);
    
    this.ctx.restore();
  }
  
  private renderStartScreen() {
    // Animated gradient background
    const time = Date.now() / 1000;
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, `hsl(${(time * 20) % 360}, 50%, 50%)`);
    gradient.addColorStop(0.5, `hsl(${(time * 20 + 180) % 360}, 50%, 50%)`);
    gradient.addColorStop(1, `hsl(${(time * 20 + 360) % 360}, 50%, 50%)`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Semi-transparent overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Title
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 80px Arial';
    
    // Bouncing effect
    const bounce = Math.sin(time * 2) * 10;
    
    // Title shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillText('BERNEDOODLE', this.canvas.width / 2 + 4, this.canvas.height / 2 - 100 + bounce + 4);
    this.ctx.fillText('ADVENTURE', this.canvas.width / 2 + 4, this.canvas.height / 2 - 20 + bounce + 4);
    
    // Title with gradient
    const titleGradient = this.ctx.createLinearGradient(
      this.canvas.width / 2 - 300, 0,
      this.canvas.width / 2 + 300, 0
    );
    titleGradient.addColorStop(0, '#FFD700');
    titleGradient.addColorStop(0.5, '#FFA500');
    titleGradient.addColorStop(1, '#FF6347');
    
    this.ctx.fillStyle = titleGradient;
    this.ctx.fillText('BERNEDOODLE', this.canvas.width / 2, this.canvas.height / 2 - 100 + bounce);
    this.ctx.fillText('ADVENTURE', this.canvas.width / 2, this.canvas.height / 2 - 20 + bounce);
    
    // Draw two cute dogs
    this.drawCelebrationDog(
      this.canvas.width / 2 - 150,
      this.canvas.height / 2 + 80,
      0,
      true,
      time
    );
    
    this.drawCelebrationDog(
      this.canvas.width / 2 + 150,
      this.canvas.height / 2 + 80,
      1,
      true,
      time
    );
    
    // Instructions
    this.ctx.font = 'bold 32px Arial';
    const pulse = Math.sin(time * 4) * 0.2 + 0.8;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    this.ctx.fillText('Press A Button to Start!', this.canvas.width / 2, this.canvas.height - 100);
    
    // Game info
    this.ctx.font = '20px Arial';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText('Collect treats 🍖  Find cats 🐱  Grab bones 🧿', this.canvas.width / 2, this.canvas.height - 60);
    this.ctx.fillText('2 Players 🎮  Use Gamepads', this.canvas.width / 2, this.canvas.height - 30);
  }
}