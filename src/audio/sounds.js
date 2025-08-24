/**
 * @fileoverview Audio Manager and Sound Effects System
 * Manages audio playback, sound effects, and background music with advanced features
 * like pooling, preloading, and fallback handling.
 * 
 * @module src/audio/sounds
 * @version 1.0.0
 */

// Constants for audio states and configurations
const AUDIO_STATES = Object.freeze({
    PLAYING: 'playing',
    PAUSED: 'paused',
    STOPPED: 'stopped',
    LOADING: 'loading',
    ERROR: 'error'
});

const AUDIO_TYPES = Object.freeze({
    SOUND_EFFECT: 'sfx',
    BACKGROUND_MUSIC: 'bgm',
    VOICE: 'voice'
});

const DEFAULT_CONFIG = Object.freeze({
    maxConcurrentSounds: 8,
    fadeInDuration: 1000,
    fadeOutDuration: 500,
    defaultVolume: 0.7,
    enableCache: true
});

/**
 * Custom error class for audio-related errors
 */
class AudioError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'AudioError';
        this.code = code;
    }
}

/**
 * Manages audio resources and playback
 */
class AudioManager {
    #audioContext;
    #soundCache;
    #activeSounds;
    #config;
    #masterVolume;
    #initialized;

    /**
     * @param {Object} config - Configuration options
     */
    constructor(config = {}) {
        this.#config = { ...DEFAULT_CONFIG, ...config };
        this.#soundCache = new Map();
        this.#activeSounds = new Set();
        this.#masterVolume = this.#config.defaultVolume;
        this.#initialized = false;
    }

    /**
     * Initializes the audio context and system
     * @returns {Promise<void>}
     * @throws {AudioError}
     */
    async initialize() {
        try {
            this.#audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await this.#audioContext.resume();
            this.#initialized = true;
        } catch (error) {
            throw new AudioError('Failed to initialize audio context', 'INIT_FAILED');
        }
    }

    /**
     * Loads an audio file and caches it
     * @param {string} id - Unique identifier for the sound
     * @param {string} url - URL of the audio file
     * @param {AUDIO_TYPES} type - Type of audio
     * @returns {Promise<AudioBuffer>}
     */
    async loadSound(id, url, type = AUDIO_TYPES.SOUND_EFFECT) {
        try {
            if (this.#soundCache.has(id)) {
                return this.#soundCache.get(id);
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new AudioError(`Failed to fetch audio: ${url}`, 'FETCH_FAILED');
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.#audioContext.decodeAudioData(arrayBuffer);

            if (this.#config.enableCache) {
                this.#soundCache.set(id, { buffer: audioBuffer, type });
            }

            return audioBuffer;
        } catch (error) {
            throw new AudioError(`Failed to load sound: ${error.message}`, 'LOAD_FAILED');
        }
    }

    /**
     * Plays a sound with specified options
     * @param {string} id - Sound identifier
     * @param {Object} options - Playback options
     * @returns {Promise<void>}
     */
    async playSound(id, options = {}) {
        if (!this.#initialized) {
            throw new AudioError('Audio system not initialized', 'NOT_INITIALIZED');
        }

        const {
            volume = this.#masterVolume,
            loop = false,
            pitch = 1,
            fadeIn = false
        } = options;

        try {
            const sound = this.#soundCache.get(id);
            if (!sound) {
                throw new AudioError(`Sound not found: ${id}`, 'SOUND_NOT_FOUND');
            }

            const source = this.#audioContext.createBufferSource();
            const gainNode = this.#audioContext.createGain();

            source.buffer = sound.buffer;
            source.playbackRate.value = pitch;
            source.loop = loop;

            gainNode.gain.value = fadeIn ? 0 : volume * this.#masterVolume;
            
            source.connect(gainNode);
            gainNode.connect(this.#audioContext.destination);

            if (fadeIn) {
                gainNode.gain.linearRampToValueAtTime(
                    volume * this.#masterVolume,
                    this.#audioContext.currentTime + this.#config.fadeInDuration / 1000
                );
            }

            source.start(0);
            this.#activeSounds.add({ source, gainNode, id });

            source.onended = () => {
                this.#activeSounds.delete({ source, gainNode, id });
            };
        } catch (error) {
            throw new AudioError(`Playback failed: ${error.message}`, 'PLAYBACK_FAILED');
        }
    }

    /**
     * Stops all active sounds
     * @param {boolean} fadeOut - Whether to fade out before stopping
     * @returns {Promise<void>}
     */
    async stopAll(fadeOut = false) {
        const stopPromises = Array.from(this.#activeSounds).map(async ({ source, gainNode }) => {
            if (fadeOut) {
                gainNode.gain.linearRampToValueAtTime(
                    0,
                    this.#audioContext.currentTime + this.#config.fadeOutDuration / 1000
                );
                await new Promise(resolve => setTimeout(resolve, this.#config.fadeOutDuration));
            }
            source.stop();
        });

        await Promise.all(stopPromises);
        this.#activeSounds.clear();
    }

    /**
     * Sets the master volume
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        this.#masterVolume = Math.max(0, Math.min(1, volume));
        this.#activeSounds.forEach(({ gainNode }) => {
            gainNode.gain.value = gainNode.gain.value * this.#masterVolume;
        });
    }

    /**
     * Cleans up resources and stops all sounds
     */
    dispose() {
        this.stopAll();
        this.#soundCache.clear();
        if (this.#audioContext) {
            this.#audioContext.close();
        }
        this.#initialized = false;
    }
}

export {
    AudioManager,
    AudioError,
    AUDIO_STATES,
    AUDIO_TYPES
};