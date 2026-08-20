/**
 * Web Audio API synthesizer for Morse Code sidetone and Speech Synthesis for Phonetics
 */

class MorsePlayer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Play Morse pattern like "... --- ..."
   * dot = 60ms, dash = 180ms, intra-element = 60ms, letter-space = 180ms
   */
  async playMorse(pattern: string, wpm = 20): Promise<void> {
    try {
      const ctx = this.getContext();
      const dotDuration = 1.2 / wpm; // seconds
      const freq = 700; // Hz standard radio CW tone

      let currentTime = ctx.currentTime + 0.05;

      for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        if (char === '.' || char === '-') {
          const isDash = char === '-';
          const duration = isDash ? dotDuration * 3 : dotDuration;

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, currentTime);

          // Smooth attack and release to avoid click artifacts
          gain.gain.setValueAtTime(0, currentTime);
          gain.gain.linearRampToValueAtTime(0.3, currentTime + 0.005);
          gain.gain.setValueAtTime(0.3, currentTime + duration - 0.005);
          gain.gain.linearRampToValueAtTime(0, currentTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(currentTime);
          osc.stop(currentTime + duration);

          currentTime += duration + dotDuration; // space between elements
        } else if (char === ' ') {
          currentTime += dotDuration * 3; // space between characters
        } else if (char === '/') {
          currentTime += dotDuration * 7; // space between words
        }
      }
    } catch (e) {
      console.warn('AudioContext playback error or blocked:', e);
    }
  }

  /**
   * Play simple audio beep/tone for interactive feedback
   */
  playTone(freq = 800, durationMs = 50): void {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const duration = durationMs / 1000;
      const currentTime = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, currentTime);

      gain.gain.setValueAtTime(0, currentTime);
      gain.gain.linearRampToValueAtTime(0.2, currentTime + 0.005);
      gain.gain.setValueAtTime(0.2, currentTime + duration - 0.005);
      gain.gain.linearRampToValueAtTime(0, currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(currentTime);
      osc.stop(currentTime + duration);
    } catch (e) {
      console.warn('Audio feedback failed or blocked:', e);
    }
  }

  speak(text: string, lang = 'en-US'): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const morseAudio = new MorsePlayer();
