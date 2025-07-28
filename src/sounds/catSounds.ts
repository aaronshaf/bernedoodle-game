export function createMeowSounds(audioContext: AudioContext, masterVolume: GainNode) {
  const createOscillator = (frequency: number, type: OscillatorType = 'sine'): OscillatorNode => {
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    return oscillator;
  };

  return [
    // Classic long meow
    () => {
      const duration = 0.5;
      const now = audioContext.currentTime;
      
      const osc = createOscillator(400, 'sine');
      const osc2 = createOscillator(800, 'sine');
      
      const env = audioContext.createGain();
      const env2 = audioContext.createGain();
      
      // Main meow shape
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.3, now + 0.05);
      env.gain.exponentialRampToValueAtTime(0.15, now + 0.3);
      env.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      // Harmonic
      env2.gain.setValueAtTime(0, now);
      env2.gain.linearRampToValueAtTime(0.15, now + 0.05);
      env2.gain.exponentialRampToValueAtTime(0.08, now + 0.3);
      env2.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      // Pitch contour - starts mid, goes up, then down
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(350, now + duration);
      
      osc2.frequency.setValueAtTime(800, now);
      osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1000, now + 0.2);
      osc2.frequency.exponentialRampToValueAtTime(700, now + duration);
      
      osc.connect(env);
      osc2.connect(env2);
      env.connect(masterVolume);
      env2.connect(masterVolume);
      
      osc.start(now);
      osc2.start(now);
      osc.stop(now + duration);
      osc2.stop(now + duration);
    },
    // Short mew
    () => {
      const duration = 0.2;
      const now = audioContext.currentTime;
      
      const osc = createOscillator(800, 'sine');
      const env = audioContext.createGain();
      
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.25, now + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(600, now + duration);
      
      osc.connect(env);
      env.connect(masterVolume);
      osc.start(now);
      osc.stop(now + duration);
    },
    // Double meow (meow-meow)
    () => {
      const meowDuration = 0.15;
      const now = audioContext.currentTime;
      
      for (let i = 0; i < 2; i++) {
        const startTime = now + i * 0.2;
        const osc = createOscillator(500 + i * 100, 'sine');
        const env = audioContext.createGain();
        
        env.gain.setValueAtTime(0, startTime);
        env.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        env.gain.exponentialRampToValueAtTime(0.001, startTime + meowDuration);
        
        osc.frequency.setValueAtTime(500 + i * 100, startTime);
        osc.frequency.exponentialRampToValueAtTime(800 + i * 100, startTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(400 + i * 50, startTime + meowDuration);
        
        osc.connect(env);
        env.connect(masterVolume);
        osc.start(startTime);
        osc.stop(startTime + meowDuration);
      }
    }
  ];
}