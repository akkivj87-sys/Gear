/**
 * Procedural Web Audio API Sound Engine.
 * 100% synthesized in code without any external audio asset dependencies or 404 risks.
 */

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.85;
  private sfxVolume: number = 0.85;

  // Continuous sound nodes
  private slideGain: GainNode | null = null;
  private slideFilter: BiquadFilterNode | null = null;
  private isSlidingAudio: boolean = false;

  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Alternating footstep pan
  private footstepStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init(): void {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.initWindAmbience();
    this.initSlideLoop();
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMasterVolume(val: number): void {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  public setSfxVolume(val: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  // --- PROCEDURAL SOUND GENERATORS ---

  private createNoiseBuffer(duration: number = 0.5): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public playFootstep(speedRatio: number = 1.0): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const noiseBuffer = this.createNoiseBuffer(0.1);
    if (!noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const baseFreq = this.footstepStep % 2 === 0 ? 800 : 920;
    filter.frequency.setValueAtTime(baseFreq * (0.9 + Math.random() * 0.2), t);
    filter.Q.setValueAtTime(3.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28 * Math.min(1.4, speedRatio), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    const panner = this.ctx.createStereoPanner?.();
    if (panner) {
      panner.pan.setValueAtTime(this.footstepStep % 2 === 0 ? -0.25 : 0.25, t);
      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain);
    } else {
      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
    }

    noiseSource.start(t);
    noiseSource.stop(t + 0.09);
    this.footstepStep++;
  }

  public playJump(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.15);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  public playDoubleJump(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.2);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  public playLand(impactIntensity: number = 1.0): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);

    const volume = Math.min(0.6, 0.25 * impactIntensity);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);

    // Add noise thump
    const noiseBuffer = this.createNoiseBuffer(0.18);
    if (noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(volume * 0.7, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 0.17);
    }
  }

  public playRoll(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const buffer = this.createNoiseBuffer(0.4);
    if (!buffer) return;

    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(1400, t + 0.18);
    filter.frequency.exponentialRampToValueAtTime(250, t + 0.38);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.38, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.39);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.4);
  }

  public playWallRun(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playMantle(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(310, t + 0.15);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playGrappleFire(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.22);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playCheckpoint(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chord arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.42);
    });
  }

  public playCollectible(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const notes = [784, 1175]; // G5, D6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  }

  public playLevelComplete(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    fanfare.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.65);
    });
  }

  // --- CONTINUOUS AUDIO (SLIDE & WIND) ---

  private initSlideLoop(): void {
    if (!this.ctx || !this.sfxGain) return;

    const noiseBuffer = this.createNoiseBuffer(2.0);
    if (!noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    this.slideFilter = this.ctx.createBiquadFilter();
    this.slideFilter.type = 'bandpass';
    this.slideFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
    this.slideFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    this.slideGain = this.ctx.createGain();
    this.slideGain.gain.setValueAtTime(0, this.ctx.currentTime);

    noiseSource.connect(this.slideFilter);
    this.slideFilter.connect(this.slideGain);
    this.slideGain.connect(this.sfxGain);

    noiseSource.start();
  }

  public setSlideActive(active: boolean, intensity: number = 1.0): void {
    if (!this.ctx || !this.slideGain) return;
    this.resume();

    const t = this.ctx.currentTime;
    if (active) {
      this.isSlidingAudio = true;
      const targetGain = Math.min(0.4, 0.28 * intensity);
      this.slideGain.gain.cancelScheduledValues(t);
      this.slideGain.gain.linearRampToValueAtTime(targetGain, t + 0.05);
    } else if (this.isSlidingAudio) {
      this.isSlidingAudio = false;
      this.slideGain.gain.cancelScheduledValues(t);
      this.slideGain.gain.linearRampToValueAtTime(0, t + 0.1);
    }
  }

  private initWindAmbience(): void {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(3.0);
    if (!noiseBuffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(200, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

    noiseSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    noiseSource.start();
  }

  public updateSpeedWind(speed: number, maxSpeed: number = 25.0): void {
    if (!this.ctx || !this.windGain || !this.windFilter) return;

    const t = this.ctx.currentTime;
    const ratio = Math.max(0, Math.min(1.0, (speed - 10.0) / (maxSpeed - 10.0)));
    const targetGain = ratio * 0.22;
    const targetCutoff = 250 + ratio * 1800;

    this.windGain.gain.setTargetAtTime(targetGain, t, 0.1);
    this.windFilter.frequency.setTargetAtTime(targetCutoff, t, 0.1);
  }
}
