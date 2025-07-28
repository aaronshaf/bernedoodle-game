export class AudioSystem {
  private audioContext: AudioContext;
  private masterVolume: GainNode;
  private initialized = false;

  constructor() {
    // Create audio context on first user interaction
    this.audioContext = null as any;
    this.masterVolume = null as any;
  }

  private init() {
    if (this.initialized) return;
    
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterVolume = this.audioContext.createGain();
    this.masterVolume.connect(this.audioContext.destination);
    this.masterVolume.gain.value = 0.7;
    this.initialized = true;
  }

  private createOscillator(frequency: number, type: OscillatorType = 'sine'): OscillatorNode {
    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    return oscillator;
  }

  private createEnvelope(duration: number, attack = 0.01, decay = 0.1, sustain = 0.3, release = 0.2): GainNode {
    const envelope = this.audioContext.createGain();
    const now = this.audioContext.currentTime;
    
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1, now + attack);
    envelope.gain.linearRampToValueAtTime(sustain, now + attack + decay);
    envelope.gain.setValueAtTime(sustain, now + duration - release);
    envelope.gain.linearRampToValueAtTime(0, now + duration);
    
    return envelope;
  }

  playTreatSound() {
    this.init();
    const duration = 0.2;
    
    // Create random variations of happy sounds
    const variations = [
      // Major chord arpeggio
      [261.63, 329.63, 392.00], // C-E-G
      [293.66, 369.99, 440.00], // D-F#-A
      [329.63, 415.30, 493.88], // E-G#-B
      // Pentatonic riffs
      [392.00, 493.88, 587.33], // G-B-D
      [440.00, 554.37, 659.25], // A-C#-E
    ];
    
    const notes = variations[Math.floor(Math.random() * variations.length)];
    const noteDelay = 0.05;
    
    notes.forEach((freq, i) => {
      const osc = this.createOscillator(freq * (1 + Math.random() * 0.02), 'square');
      const env = this.createEnvelope(duration - i * noteDelay, 0.01, 0.05, 0.25, 0.1);
      
      osc.connect(env);
      env.connect(this.masterVolume);
      
      const startTime = this.audioContext.currentTime + i * noteDelay;
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  playCatSound() {
    this.init();
    
    const catSounds = [
      // Classic meow
      () => {
        const duration = 0.3;
        const osc = this.createOscillator(800, 'sine');
        const env = this.createEnvelope(duration, 0.05, 0.1, 0.4, 0.15);
        const now = this.audioContext.currentTime;
        
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(700, now + duration);
        
        osc.connect(env);
        env.connect(this.masterVolume);
        osc.start(now);
        osc.stop(now + duration);
      },
      // Kitten mew
      () => {
        const duration = 0.15;
        const osc = this.createOscillator(1200, 'sine');
        const env = this.createEnvelope(duration, 0.01, 0.03, 0.3, 0.05);
        const now = this.audioContext.currentTime;
        
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + duration/2);
        osc.frequency.exponentialRampToValueAtTime(1000, now + duration);
        
        osc.connect(env);
        env.connect(this.masterVolume);
        osc.start(now);
        osc.stop(now + duration);
      },
      // Purr
      () => {
        const duration = 0.4;
        const osc = this.createOscillator(25, 'sawtooth');
        const env = this.createEnvelope(duration, 0.1, 0.1, 0.2, 0.1);
        
        osc.connect(env);
        env.connect(this.masterVolume);
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
      }
    ];
    
    const soundFunc = catSounds[Math.floor(Math.random() * catSounds.length)];
    soundFunc();
  }

  playBoneSound() {
    this.init();
    
    const boneSounds = [
      // Crunchy bite
      () => {
        const duration = 0.1;
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate crunchy noise
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() - 0.5) * Math.exp(-i / bufferSize * 10);
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        
        const env = this.createEnvelope(duration, 0.001, 0.01, 0.3, 0.05);
        
        noise.connect(filter);
        filter.connect(env);
        env.connect(this.masterVolume);
        noise.start();
      },
      // Cartoon chomp
      () => {
        const duration = 0.15;
        const osc1 = this.createOscillator(100, 'sawtooth');
        const osc2 = this.createOscillator(50, 'square');
        const env = this.createEnvelope(duration, 0.001, 0.02, 0.4, 0.05);
        const now = this.audioContext.currentTime;
        
        // Quick pitch drop
        osc1.frequency.setValueAtTime(200, now);
        osc1.frequency.exponentialRampToValueAtTime(50, now + 0.05);
        osc2.frequency.setValueAtTime(100, now);
        osc2.frequency.exponentialRampToValueAtTime(25, now + 0.05);
        
        osc1.connect(env);
        osc2.connect(env);
        env.connect(this.masterVolume);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
      }
    ];
    
    const soundFunc = boneSounds[Math.floor(Math.random() * boneSounds.length)];
    soundFunc();
  }

  playPowerUpSound() {
    this.init();
    const duration = 0.6;
    
    // Create a more dynamic power-up sound with wobble
    const osc1 = this.createOscillator(100, 'sawtooth');
    const osc2 = this.createOscillator(100.5, 'square');
    
    // LFO for wobble effect
    const lfo = this.createOscillator(10, 'sine');
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 50;
    
    const envelope = this.createEnvelope(duration, 0.01, 0.1, 0.6, 0.2);
    
    // Filter with resonance
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 10;
    
    // Connect LFO to oscillator frequencies
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.masterVolume);
    
    const now = this.audioContext.currentTime;
    
    // More interesting frequency sweep
    osc1.frequency.setValueAtTime(100, now);
    osc1.frequency.exponentialRampToValueAtTime(400, now + duration * 0.3);
    osc1.frequency.exponentialRampToValueAtTime(800, now + duration * 0.6);
    osc1.frequency.setValueAtTime(800, now + duration * 0.8);
    osc1.frequency.exponentialRampToValueAtTime(1600, now + duration);
    
    osc2.frequency.setValueAtTime(100.5, now);
    osc2.frequency.exponentialRampToValueAtTime(400.5, now + duration * 0.3);
    osc2.frequency.exponentialRampToValueAtTime(800.5, now + duration * 0.6);
    osc2.frequency.setValueAtTime(800.5, now + duration * 0.8);
    osc2.frequency.exponentialRampToValueAtTime(1600.5, now + duration);
    
    // Filter sweep with modulation
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + duration * 0.5);
    filter.frequency.exponentialRampToValueAtTime(5000, now + duration);
    
    // LFO speed up
    lfo.frequency.setValueAtTime(5, now);
    lfo.frequency.exponentialRampToValueAtTime(20, now + duration);
    
    osc1.start(now);
    osc2.start(now);
    lfo.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
    lfo.stop(now + duration);
  }

  playBackgroundMusic() {
    this.init();
    
    // Simple looping melody
    const notes = [
      { freq: 261.63, time: 0 },    // C4
      { freq: 293.66, time: 0.25 },  // D4
      { freq: 329.63, time: 0.5 },   // E4
      { freq: 261.63, time: 0.75 },  // C4
      { freq: 329.63, time: 1 },     // E4
      { freq: 392.00, time: 1.25 },  // G4
      { freq: 329.63, time: 1.5 },   // E4
      { freq: 261.63, time: 1.75 },  // C4
    ];
    
    const playMelody = () => {
      const now = this.audioContext.currentTime;
      
      notes.forEach(note => {
        const osc = this.createOscillator(note.freq, 'triangle');
        const envelope = this.audioContext.createGain();
        
        envelope.gain.setValueAtTime(0, now + note.time);
        envelope.gain.linearRampToValueAtTime(0.1, now + note.time + 0.05);
        envelope.gain.setValueAtTime(0.1, now + note.time + 0.2);
        envelope.gain.linearRampToValueAtTime(0, now + note.time + 0.25);
        
        osc.connect(envelope);
        envelope.connect(this.masterVolume);
        
        osc.start(now + note.time);
        osc.stop(now + note.time + 0.25);
      });
    };
    
    // Play immediately and loop
    playMelody();
    setInterval(playMelody, 2000);
  }

  playComboSound(multiplier: number) {
    this.init();
    const duration = 0.4;
    
    // Create ascending notes based on multiplier
    const baseFreq = 300;
    const notes = [];
    
    for (let i = 0; i < Math.min(multiplier, 5); i++) {
      notes.push(baseFreq * Math.pow(1.2, i));
    }
    
    notes.forEach((freq, i) => {
      const osc = this.createOscillator(freq, 'triangle');
      const env = this.audioContext.createGain();
      const now = this.audioContext.currentTime;
      const noteStart = now + i * 0.08;
      const noteDuration = 0.15;
      
      env.gain.setValueAtTime(0, noteStart);
      env.gain.linearRampToValueAtTime(0.3, noteStart + 0.01);
      env.gain.setValueAtTime(0.3, noteStart + noteDuration - 0.02);
      env.gain.linearRampToValueAtTime(0, noteStart + noteDuration);
      
      osc.connect(env);
      env.connect(this.masterVolume);
      
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration);
    });
  }

  setVolume(volume: number) {
    if (this.initialized && this.masterVolume) {
      this.masterVolume.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  playVictoryFanfare() {
    this.init();
    
    // Victory fanfare with multiple notes
    const notes = [
      { freq: 523.25, time: 0, dur: 0.2 },      // C5
      { freq: 523.25, time: 0.2, dur: 0.2 },    // C5
      { freq: 523.25, time: 0.4, dur: 0.2 },    // C5
      { freq: 523.25, time: 0.6, dur: 0.4 },    // C5 (longer)
      { freq: 415.30, time: 1, dur: 0.2 },       // G#4
      { freq: 466.16, time: 1.2, dur: 0.2 },     // A#4
      { freq: 523.25, time: 1.4, dur: 0.4 },     // C5
      { freq: 466.16, time: 1.8, dur: 0.2 },     // A#4
      { freq: 523.25, time: 2, dur: 0.6 },       // C5 (final)
    ];
    
    const now = this.audioContext.currentTime;
    
    notes.forEach(note => {
      const osc = this.createOscillator(note.freq, 'square');
      const env = this.audioContext.createGain();
      
      env.gain.setValueAtTime(0, now + note.time);
      env.gain.linearRampToValueAtTime(0.4, now + note.time + 0.02);
      env.gain.setValueAtTime(0.4, now + note.time + note.dur - 0.05);
      env.gain.linearRampToValueAtTime(0, now + note.time + note.dur);
      
      // Add harmony
      const harmony = this.createOscillator(note.freq * 1.5, 'triangle');
      const harmonyEnv = this.audioContext.createGain();
      harmonyEnv.gain.setValueAtTime(0, now + note.time);
      harmonyEnv.gain.linearRampToValueAtTime(0.2, now + note.time + 0.02);
      harmonyEnv.gain.setValueAtTime(0.2, now + note.time + note.dur - 0.05);
      harmonyEnv.gain.linearRampToValueAtTime(0, now + note.time + note.dur);
      
      osc.connect(env);
      harmony.connect(harmonyEnv);
      env.connect(this.masterVolume);
      harmonyEnv.connect(this.masterVolume);
      
      osc.start(now + note.time);
      harmony.start(now + note.time);
      osc.stop(now + note.time + note.dur);
      harmony.stop(now + note.time + note.dur);
    });
  }
  
  playSquirrelSound() {
    this.init();
    
    const squirrelSounds = [
      // Chittering sound
      () => {
        const duration = 0.3;
        const now = this.audioContext.currentTime;
        
        for (let i = 0; i < 5; i++) {
          const osc = this.createOscillator(1000 + Math.random() * 1000, 'square');
          const env = this.audioContext.createGain();
          
          const startTime = now + i * 0.05;
          env.gain.setValueAtTime(0, startTime);
          env.gain.linearRampToValueAtTime(0.2, startTime + 0.01);
          env.gain.linearRampToValueAtTime(0, startTime + 0.04);
          
          osc.connect(env);
          env.connect(this.masterVolume);
          
          osc.start(startTime);
          osc.stop(startTime + 0.05);
        }
      },
      // Squeak
      () => {
        const duration = 0.2;
        const osc = this.createOscillator(2000, 'sine');
        const env = this.createEnvelope(duration, 0.01, 0.02, 0.3, 0.1);
        const now = this.audioContext.currentTime;
        
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(3000, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(2000, now + duration);
        
        osc.connect(env);
        env.connect(this.masterVolume);
        osc.start(now);
        osc.stop(now + duration);
      }
    ];
    
    const soundFunc = squirrelSounds[Math.floor(Math.random() * squirrelSounds.length)];
    soundFunc();
  }
  
  playLevelCompleteSound() {
    this.init();
    
    // Ascending arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4-E4-G4-C5
    const duration = 0.15;
    
    notes.forEach((freq, i) => {
      const osc = this.createOscillator(freq, 'sine');
      const env = this.createEnvelope(duration, 0.01, 0.05, 0.3, 0.08);
      
      osc.connect(env);
      env.connect(this.masterVolume);
      
      const startTime = this.audioContext.currentTime + i * 0.1;
      osc.start(startTime);
      osc.stop(startTime + duration);
      
      // Add sparkle effect
      const sparkle = this.createOscillator(freq * 2, 'triangle');
      const sparkleEnv = this.audioContext.createGain();
      sparkleEnv.gain.setValueAtTime(0, startTime);
      sparkleEnv.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
      sparkleEnv.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      sparkle.connect(sparkleEnv);
      sparkleEnv.connect(this.masterVolume);
      sparkle.start(startTime);
      sparkle.stop(startTime + duration);
    });
  }
  
  playBarkSound() {
    this.init();
    const { createBarkSounds } = require('./sounds/dogSounds');
    const barkSounds = createBarkSounds(this.audioContext, this.masterVolume);
    const soundFunc = barkSounds[Math.floor(Math.random() * barkSounds.length)];
    soundFunc();
  }
  
  playMeowSound() {
    this.init();
    const { createMeowSounds } = require('./sounds/catSounds');
    const meowSounds = createMeowSounds(this.audioContext, this.masterVolume);
    const soundFunc = meowSounds[Math.floor(Math.random() * meowSounds.length)];
    soundFunc();
  }
}

export const audioSystem = new AudioSystem();