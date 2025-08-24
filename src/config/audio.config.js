/**
 * @fileoverview Audio Configuration and Management System
 * @description Centralized configuration for audio settings, sound effects, and background music
 * @module config/audio.config
 * @version 1.0.0
 */

/**
 * @typedef {Object} AudioFormat
 * @property {string[]} supported - List of supported audio formats
 * @property {string} fallback - Fallback format if preferred isn't supported
 */

/**
 * @typedef {Object} VolumeSettings
 * @property {number} min - Minimum volume level (0-1)
 * @property {number} max - Maximum volume level (0-1)
 * @property {number} default - Default volume level (0-1)
 * @property {number} step - Volume adjustment step
 */

/**
 * @constant {Object} AUDIO_FORMATS
 * @description Supported audio formats and fallbacks
 */
export const AUDIO_FORMATS = Object.freeze({
  supported: ['mp3', 'wav', 'ogg', 'aac'],
  fallback: 'mp3',
});

/**
 * @constant {Object} VOLUME_CONFIG
 * @description Volume control configuration
 */
export const VOLUME_CONFIG = Object.freeze({
  master: {
    min: 0,
    max: 1,
    default: 0.8,
    step: 0.05,
  },
  music: {
    min: 0,
    max: 1,
    default: 0.6,
    step: 0.05,
  },
  sfx: {
    min: 0,
    max: 1,
    default: 0.7,
    step: 0.05,
  },
});

/**
 * @constant {Object} FADE_SETTINGS
 * @description Audio fade transition settings
 */
export const FADE_SETTINGS = Object.freeze({
  defaultDuration: 1000, // ms
  fadeInCurve: 'linear',
  fadeOutCurve: 'exponential',
});

/**
 * @constant {Object} AUDIO_PATHS
 * @description Path configuration for audio assets
 */
export const AUDIO_PATHS = Object.freeze({
  baseUrl: '/assets/audio',
  music: '/music',
  sfx: '/sfx',
  voice: '/voice',
});

/**
 * @constant {Object} PLAYBACK_CONFIG
 * @description Playback behavior configuration
 */
export const PLAYBACK_CONFIG = Object.freeze({
  maxConcurrentSounds: 8,
  priorityLevels: {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3,
  },
  bufferSize: 2048,
  sampleRate: 44100,
});

/**
 * @constant {Object} ERROR_MESSAGES
 * @description Standardized error messages for audio operations
 */
export const ERROR_MESSAGES = Object.freeze({
  AUDIO_CONTEXT_FAILED: 'Failed to create AudioContext',
  FORMAT_UNSUPPORTED: 'Audio format not supported',
  LOAD_FAILED: 'Failed to load audio file',
  DECODE_FAILED: 'Failed to decode audio data',
  INVALID_VOLUME: 'Invalid volume level specified',
});

/**
 * @constant {Object} AUDIO_CATEGORIES
 * @description Audio category definitions and settings
 */
export const AUDIO_CATEGORIES = Object.freeze({
  BACKGROUND_MUSIC: {
    maxInstances: 1,
    fadeInDuration: 2000,
    fadeOutDuration: 1500,
    loop: true,
  },
  SOUND_EFFECTS: {
    maxInstances: 4,
    fadeInDuration: 0,
    fadeOutDuration: 200,
    loop: false,
  },
  VOICE: {
    maxInstances: 2,
    fadeInDuration: 100,
    fadeOutDuration: 100,
    loop: false,
  },
  AMBIENT: {
    maxInstances: 2,
    fadeInDuration: 1000,
    fadeOutDuration: 1000,
    loop: true,
  },
});

/**
 * @constant {Object} AUDIO_PRESETS
 * @description Common audio effect presets
 */
export const AUDIO_PRESETS = Object.freeze({
  default: {
    gain: 1.0,
    pan: 0,
  },
  muffled: {
    gain: 0.6,
    lowpass: 800,
  },
  distant: {
    gain: 0.4,
    reverb: 0.6,
  },
});

/**
 * Validates audio configuration settings
 * @param {Object} config - Audio configuration to validate
 * @throws {Error} If configuration is invalid
 */
export const validateAudioConfig = (config) => {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid audio configuration');
  }

  // Volume validation
  if (config.volume) {
    if (config.volume < VOLUME_CONFIG.master.min || 
        config.volume > VOLUME_CONFIG.master.max) {
      throw new Error(ERROR_MESSAGES.INVALID_VOLUME);
    }
  }

  // Format validation
  if (config.format && !AUDIO_FORMATS.supported.includes(config.format)) {
    throw new Error(ERROR_MESSAGES.FORMAT_UNSUPPORTED);
  }
};

/**
 * Default export of complete audio configuration
 */
export default {
  formats: AUDIO_FORMATS,
  volume: VOLUME_CONFIG,
  fade: FADE_SETTINGS,
  paths: AUDIO_PATHS,
  playback: PLAYBACK_CONFIG,
  categories: AUDIO_CATEGORIES,
  presets: AUDIO_PRESETS,
  errors: ERROR_MESSAGES,
  validate: validateAudioConfig,
};