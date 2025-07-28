export function createBarkSounds(audioContext: AudioContext, masterVolume: GainNode) {
  const createOscillator = (frequency: number, type: OscillatorType = 'sine'): OscillatorNode => {
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    return oscillator;
  };

  return [
    // Deep woof
    () => {
      const duration = 0.25;
      const now = audioContext.currentTime;
      
      // Create noise for texture
      const bufferSize = audioContext.sampleRate * duration;
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() - 0.5) * 0.3;
      }
      
      const noise = audioContext.createBufferSource();
      noise.buffer = buffer;
      
      // Low pass filter for deep sound
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      filter.Q.value = 5;
      
      // Tone component
      const osc = createOscillator(150, 'sawtooth');
      const osc2 = createOscillator(75, 'sine');
      
      // Envelope
      const env = audioContext.createGain();
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.4, now + 0.02);
      env.gain.exponentialRampToValueAtTime(0.2, now + 0.1);
      env.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      // Pitch bend
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      osc2.frequency.setValueAtTime(100, now);
      osc2.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      
      noise.connect(filter);
      filter.connect(env);
      osc.connect(env);
      osc2.connect(env);
      env.connect(masterVolume);
      
      noise.start(now);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + duration);
      osc2.stop(now + duration);
    },
    // Playful ruff ruff
    () => {
      const barkDuration = 0.12;
      const now = audioContext.currentTime;
      
      // Two quick barks
      for (let bark = 0; bark < 2; bark++) {
        const startTime = now + bark * 0.15;
        
        const osc = createOscillator(250, 'square');
        const osc2 = createOscillator(125, 'sawtooth');
        
        const env = audioContext.createGain();
        env.gain.setValueAtTime(0, startTime);
        env.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, startTime + barkDuration);
        
        // Pitch variation
        osc.frequency.setValueAtTime(300 - bark * 50, startTime);
        osc.frequency.exponentialRampToValueAtTime(150 - bark * 30, startTime + barkDuration);
        osc2.frequency.setValueAtTime(150 - bark * 25, startTime);
        osc2.frequency.exponentialRampToValueAtTime(75 - bark * 15, startTime + barkDuration);
        
        osc.connect(env);
        osc2.connect(env);
        env.connect(masterVolume);
        
        osc.start(startTime);
        osc2.start(startTime);
        osc.stop(startTime + barkDuration);
        osc2.stop(startTime + barkDuration);
      }
    },
    // High pitched yip
    () => {
      const duration = 0.1;
      const osc = createOscillator(400, 'triangle');
      const env = audioContext.createGain();
      const now = audioContext.currentTime;
      
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.3, now + 0.005);
      env.gain.setValueAtTime(0.3, now + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + duration);
      
      osc.connect(env);
      env.connect(masterVolume);
      osc.start(now);
      osc.stop(now + duration);
    }
  ];
}