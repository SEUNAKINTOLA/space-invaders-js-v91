/**
 * @fileoverview Audio Settings Storage Manager
 * Handles persistent storage and management of audio-related settings
 * including volume levels, mute states, and audio preferences.
 * 
 * @module AudioSettings
 * @author AI Senior Developer
 * @version 1.0.0
 */

// Constants for storage keys and default values
const STORAGE_KEYS = {
  MASTER_VOLUME: 'audio_master_volume',
  MUSIC_VOLUME: 'audio_music_volume',
  SFX_VOLUME: 'audio_sfx_volume',
  MUSIC_MUTED: 'audio_music_muted',
  SFX_MUTED: 'audio_sfx_muted'
};

const DEFAULT_SETTINGS = {
  masterVolume: 1.0,
  musicVolume: 0.8,
  sfxVolume: 0.7,
  musicMuted: false,
  sfxMuted: false
};

/**
 * Class representing audio settings management with persistent storage.
 * Implements the Singleton pattern to ensure consistent state across the application.
 */
class AudioSettings {
  constructor() {
    if (AudioSettings.instance) {
      return AudioSettings.instance;
    }
    AudioSettings.instance = this;
    
    this.settings = this.loadSettings();
    this.observers = new Set();
  }

  /**
   * Loads settings from localStorage with fallback to defaults
   * @private
   * @returns {Object} Current audio settings
   */
  loadSettings() {
    try {
      return {
        masterVolume: parseFloat(localStorage.getItem(STORAGE_KEYS.MASTER_VOLUME)) || DEFAULT_SETTINGS.masterVolume,
        musicVolume: parseFloat(localStorage.getItem(STORAGE_KEYS.MUSIC_VOLUME)) || DEFAULT_SETTINGS.musicVolume,
        sfxVolume: parseFloat(localStorage.getItem(STORAGE_KEYS.SFX_VOLUME)) || DEFAULT_SETTINGS.sfxVolume,
        musicMuted: JSON.parse(localStorage.getItem(STORAGE_KEYS.MUSIC_MUTED)) || DEFAULT_SETTINGS.musicMuted,
        sfxMuted: JSON.parse(localStorage.getItem(STORAGE_KEYS.SFX_MUTED)) || DEFAULT_SETTINGS.sfxMuted
      };
    } catch (error) {
      console.error('Error loading audio settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Saves current settings to localStorage
   * @private
   */
  saveSettings() {
    try {
      Object.entries(this.settings).forEach(([key, value]) => {
        localStorage.setItem(STORAGE_KEYS[key.toUpperCase()], value.toString());
      });
      this.notifyObservers();
    } catch (error) {
      console.error('Error saving audio settings:', error);
      throw new Error('Failed to save audio settings');
    }
  }

  /**
   * Sets the master volume level
   * @param {number} volume - Volume level (0.0 to 1.0)
   * @throws {Error} If volume is invalid
   */
  setMasterVolume(volume) {
    if (!this.isValidVolume(volume)) {
      throw new Error('Invalid volume level. Must be between 0.0 and 1.0');
    }
    this.settings.masterVolume = volume;
    this.saveSettings();
  }

  /**
   * Sets the music volume level
   * @param {number} volume - Volume level (0.0 to 1.0)
   * @throws {Error} If volume is invalid
   */
  setMusicVolume(volume) {
    if (!this.isValidVolume(volume)) {
      throw new Error('Invalid volume level. Must be between 0.0 and 1.0');
    }
    this.settings.musicVolume = volume;
    this.saveSettings();
  }

  /**
   * Sets the SFX volume level
   * @param {number} volume - Volume level (0.0 to 1.0)
   * @throws {Error} If volume is invalid
   */
  setSfxVolume(volume) {
    if (!this.isValidVolume(volume)) {
      throw new Error('Invalid volume level. Must be between 0.0 and 1.0');
    }
    this.settings.sfxVolume = volume;
    this.saveSettings();
  }

  /**
   * Toggles music mute state
   * @returns {boolean} New mute state
   */
  toggleMusicMute() {
    this.settings.musicMuted = !this.settings.musicMuted;
    this.saveSettings();
    return this.settings.musicMuted;
  }

  /**
   * Toggles SFX mute state
   * @returns {boolean} New mute state
   */
  toggleSfxMute() {
    this.settings.sfxMuted = !this.settings.sfxMuted;
    this.saveSettings();
    return this.settings.sfxMuted;
  }

  /**
   * Gets the effective music volume (considering master volume and mute state)
   * @returns {number} Effective music volume
   */
  getEffectiveMusicVolume() {
    return this.settings.musicMuted ? 0 : this.settings.masterVolume * this.settings.musicVolume;
  }

  /**
   * Gets the effective SFX volume (considering master volume and mute state)
   * @returns {number} Effective SFX volume
   */
  getEffectiveSfxVolume() {
    return this.settings.sfxMuted ? 0 : this.settings.masterVolume * this.settings.sfxVolume;
  }

  /**
   * Validates volume level
   * @private
   * @param {number} volume - Volume level to validate
   * @returns {boolean} Whether volume is valid
   */
  isValidVolume(volume) {
    return typeof volume === 'number' && volume >= 0 && volume <= 1;
  }

  /**
   * Adds an observer for settings changes
   * @param {Function} callback - Observer callback function
   */
  addObserver(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Observer must be a function');
    }
    this.observers.add(callback);
  }

  /**
   * Removes an observer
   * @param {Function} callback - Observer callback function to remove
   */
  removeObserver(callback) {
    this.observers.delete(callback);
  }

  /**
   * Notifies all observers of settings changes
   * @private
   */
  notifyObservers() {
    this.observers.forEach(observer => {
      try {
        observer(this.settings);
      } catch (error) {
        console.error('Error in audio settings observer:', error);
      }
    });
  }

  /**
   * Resets all settings to defaults
   */
  resetToDefaults() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }
}

// Create and freeze the singleton instance
const audioSettings = Object.freeze(new AudioSettings());

export default audioSettings;