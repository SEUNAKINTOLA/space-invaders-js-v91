/**
 * @fileoverview Audio Management System
 * Handles sound effects and background music with advanced features like
 * pooling, fading, and cross-browser compatibility.
 * @module AudioManager
 */

// Constants for audio configuration
const AUDIO_CONFIG = {
  MAX_CONCURRENT_SOUNDS: 8,
  DEFAULT_VOLUME: 0.7,
  FADE_STEP: 0.05,
  FADE_INTERVAL: 50,
};

/**
 * @typedef {Object} AudioOptions
 * @property {number} [volume=0.7] - Initial volume (0.0 to 1.0)
 * @property {boolean} [loop=false] - Whether the audio should loop
 * @property {number} [fadeInTime=0] - Fade in duration in milliseconds
 * @property {number} [fadeOutTime=0] - Fade out duration in milliseconds
 */

/**
 * Manages audio playback, sound effects, and background music
 * with support for pooling and advanced audio features.
 */
class AudioManager {
  /**
   * Creates an instance of AudioManager.
   * @throws {Error} If Web Audio API is not supported
   */
  constructor() {
    if (!this._isAudioSupported()) {
      throw new Error('Web Audio API is not supported in this browser');
    }

    this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this._masterGainNode = this._audioContext.createGain();
    this._masterGainNode.connect(this._audioContext.destination);

    this._soundEffects = new Map();
    this._backgroundMusic = null;
    this._audioBuffers = new Map();
    this._activeAudio = new Set();

    // Bind methods to preserve context
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._initializeEventListeners();
  }

  /**
   * Loads an audio file and stores it in the buffer.
   * @param {string} id - Unique identifier for the audio
   * @param {string} url - URL of the audio file
   * @returns {Promise<void>}
   * @throws {Error} If loading fails
   */
  async loadAudio(id, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this._audioContext.decodeAudioData(arrayBuffer);
      this._audioBuffers.set(id, audioBuffer);
    } catch (error) {
      throw new Error(`Failed to load audio ${id}: ${error.message}`);
    }
  }

  /**
   * Plays a sound effect with specified options.
   * @param {string} id - Identifier of the pre-loaded audio
   * @param {AudioOptions} [options={}] - Playback options
   * @returns {Promise<void>}
   */
  async playSoundEffect(id, options = {}) {
    try {
      if (this._activeAudio.size >= AUDIO_CONFIG.MAX_CONCURRENT_SOUNDS) {
        this._stopOldestSound();
      }

      const buffer = this._audioBuffers.get(id);
      if (!buffer) {
        throw new Error(`Audio ${id} not found in buffer`);
      }

      const source = this._audioContext.createBufferSource();
      const gainNode = this._audioContext.createGain();

      source.buffer = buffer;
      source.loop = options.loop || false;

      source.connect(gainNode);
      gainNode.connect(this._masterGainNode);

      const volume = options.volume || AUDIO_CONFIG.DEFAULT_VOLUME;
      gainNode.gain.value = volume;

      if (options.fadeInTime) {
        gainNode.gain.value = 0;
        this._fadeIn(gainNode, volume, options.fadeInTime);
      }

      const audioInfo = { source, gainNode, startTime: Date.now() };
      this._activeAudio.add(audioInfo);

      source.onended = () => {
        this._activeAudio.delete(audioInfo);
        source.disconnect();
        gainNode.disconnect();
      };

      source.start(0);
    } catch (error) {
      console.error(`Error playing sound effect ${id}:`, error);
    }
  }

  /**
   * Sets the master volume for all audio.
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setMasterVolume(volume) {
    if (volume < 0 || volume > 1) {
      throw new Error('Volume must be between 0.0 and 1.0');
    }
    this._masterGainNode.gain.value = volume;
  }

  /**
   * Stops all currently playing audio.
   */
  stopAll() {
    this._activeAudio.forEach(({ source, gainNode }) => {
      source.stop();
      source.disconnect();
      gainNode.disconnect();
    });
    this._activeAudio.clear();
  }

  /**
   * Suspends the audio context when the page is hidden.
   * @private
   */
  _handleVisibilityChange() {
    if (document.hidden) {
      this._audioContext.suspend();
    } else {
      this._audioContext.resume();
    }
  }

  /**
   * Initializes event listeners for page visibility.
   * @private
   */
  _initializeEventListeners() {
    document.addEventListener('visibilitychange', this._handleVisibilityChange);
  }

  /**
   * Checks if Web Audio API is supported.
   * @private
   * @returns {boolean}
   */
  _isAudioSupported() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Implements volume fade-in effect.
   * @private
   * @param {GainNode} gainNode - The gain node to fade
   * @param {number} targetVolume - Target volume level
   * @param {number} duration - Fade duration in milliseconds
   */
  _fadeIn(gainNode, targetVolume, duration) {
    let volume = 0;
    const steps = duration / AUDIO_CONFIG.FADE_INTERVAL;
    const volumeStep = targetVolume / steps;

    const fadeInterval = setInterval(() => {
      volume += volumeStep;
      if (volume >= targetVolume) {
        volume = targetVolume;
        clearInterval(fadeInterval);
      }
      gainNode.gain.value = volume;
    }, AUDIO_CONFIG.FADE_INTERVAL);
  }

  /**
   * Stops the oldest playing sound when maximum concurrent sounds is reached.
   * @private
   */
  _stopOldestSound() {
    const oldest = Array.from(this._activeAudio)
      .sort((a, b) => a.startTime - b.startTime)[0];
    
    if (oldest) {
      oldest.source.stop();
      oldest.source.disconnect();
      oldest.gainNode.disconnect();
      this._activeAudio.delete(oldest);
    }
  }

  /**
   * Cleans up resources and removes event listeners.
   */
  dispose() {
    this.stopAll();
    document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    this._audioContext.close();
    this._audioBuffers.clear();
  }
}

export default AudioManager;