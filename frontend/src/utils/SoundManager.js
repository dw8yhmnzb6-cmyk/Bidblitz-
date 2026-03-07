/**
 * BidBlitz Sound Effects Manager
 * Global sound effects for the app
 */

class SoundManager {
  constructor() {
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    this.volume = parseFloat(localStorage.getItem('soundVolume') || '0.5');
    this.sounds = {};
    this.initialized = false;
  }
  
  init() {
    if (this.initialized) return;
    
    // Define sounds with base64 encoded short beeps/tones
    // Using Web Audio API for generated sounds
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.initialized = true;
  }
  
  createTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
  
  // Coin sound - high pitched bling
  playCoin() {
    this.init();
    this.createTone(880, 0.15, 'sine');
    setTimeout(() => this.createTone(1100, 0.1, 'sine'), 100);
  }
  
  // Win sound - ascending tones
  playWin() {
    this.init();
    this.createTone(523, 0.15, 'sine'); // C
    setTimeout(() => this.createTone(659, 0.15, 'sine'), 100); // E
    setTimeout(() => this.createTone(784, 0.2, 'sine'), 200); // G
  }
  
  // Lose sound - descending tone
  playLose() {
    this.init();
    this.createTone(400, 0.3, 'sawtooth');
  }
  
  // Click sound - short pop
  playClick() {
    this.init();
    this.createTone(600, 0.05, 'square');
  }
  
  // Achievement sound - fanfare
  playAchievement() {
    this.init();
    this.createTone(523, 0.1, 'sine');
    setTimeout(() => this.createTone(659, 0.1, 'sine'), 80);
    setTimeout(() => this.createTone(784, 0.1, 'sine'), 160);
    setTimeout(() => this.createTone(1047, 0.3, 'sine'), 240);
  }
  
  // Notification sound - soft ding
  playNotification() {
    this.init();
    this.createTone(800, 0.1, 'sine');
    setTimeout(() => this.createTone(1000, 0.15, 'sine'), 80);
  }
  
  // Spin/Wheel sound
  playSpin() {
    this.init();
    let freq = 200;
    for (let i = 0; i < 10; i++) {
      setTimeout(() => this.createTone(freq + i * 50, 0.05, 'sine'), i * 50);
    }
  }
  
  // Mining sound - mechanical
  playMining() {
    this.init();
    this.createTone(150, 0.1, 'square');
    setTimeout(() => this.createTone(200, 0.1, 'square'), 100);
  }
  
  // Error sound
  playError() {
    this.init();
    this.createTone(200, 0.2, 'sawtooth');
  }
  
  // Level up sound
  playLevelUp() {
    this.init();
    const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.createTone(freq, 0.1, 'sine'), i * 60);
    });
  }
  
  // Toggle sound on/off
  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('soundEnabled', this.enabled);
    return this.enabled;
  }
  
  // Set volume
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('soundVolume', this.volume);
  }
  
  // Get current state
  isEnabled() {
    return this.enabled;
  }
  
  getVolume() {
    return this.volume;
  }
}

// Export singleton instance
const soundManager = new SoundManager();
export default soundManager;
