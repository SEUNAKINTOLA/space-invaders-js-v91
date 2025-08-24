/**
 * @fileoverview Background Music Manager
 * Handles background music playback, transitions, and state management
 * with support for cross-fading, volume control, and error recovery.
 * 
 * @module BackgroundMusic
 * @author Generated AI Engineer
 * @version 1.0.0
 */

// Constants for configuration
const FADE_DURATION_MS = 2000;
const DEFAULT_VOLUME = 0.7;
const VOLUME_STEP = 0.05;

/**
 * @typedef {Object} AudioConfig
 * @property {number} volume - Volume level (0-1)
 * @property {boolean} loop - Whether to loop the audio
 * @property {number} fadeTime - Fade duration in milliseconds
 */

/**
 * Manages background music playback and transitions
 */
class BackgroundMusic {
    /**
     * @private
     * @type {HTMLAudioElement|null}
     */
    #currentTrack = null;

    /**
     * @private
     * @type {string|null}
     */
    #currentTrackUrl = null;

    /**
     * @private
     * @type {boolean}
     */
    #isPlaying = false;

    /**
     * @private
     * @type {number}
     */
    #volume = DEFAULT_VOLUME;

    /**
     * Creates a new BackgroundMusic instance
     * @param {AudioConfig} [config] - Optional configuration
     */
    constructor(config = {}) {
        this.#volume = config.volume ?? DEFAULT_VOLUME;
        this.#setupEventListeners();
    }

    /**
     * Loads and plays a background music track
     * @param {string} url - URL of the audio file
     * @param {AudioConfig} [options] - Playback options
     * @returns {Promise<void>}
     * @throws {Error} If audio loading fails
     */
    async play(url, options = {}) {
        try {
            if (this.#currentTrackUrl === url && this.#isPlaying) {
                return;
            }

            const newTrack = new Audio();
            newTrack.volume = 0;
            newTrack.loop = options.loop ?? true;
            
            // Load audio file
            newTrack.src = url;
            await new Promise((resolve, reject) => {
                newTrack.addEventListener('canplaythrough', resolve, { once: true });
                newTrack.addEventListener('error', reject, { once: true });
                newTrack.load();
            });

            // Fade out current track if exists
            if (this.#currentTrack) {
                await this.#fadeOut(this.#currentTrack, options.fadeTime ?? FADE_DURATION_MS);
                this.#currentTrack.pause();
            }

            // Start new track
            this.#currentTrack = newTrack;
            this.#currentTrackUrl = url;
            await newTrack.play();
            await this.#fadeIn(newTrack, options.fadeTime ?? FADE_DURATION_MS);
            
            this.#isPlaying = true;
        } catch (error) {
            console.error('Failed to play background music:', error);
            this.#handlePlaybackError(error);
            throw new Error('Background music playback failed');
        }
    }

    /**
     * Stops the current background music
     * @param {number} [fadeTime] - Optional fade out duration
     * @returns {Promise<void>}
     */
    async stop(fadeTime = FADE_DURATION_MS) {
        if (!this.#currentTrack) return;

        try {
            await this.#fadeOut(this.#currentTrack, fadeTime);
            this.#currentTrack.pause();
            this.#currentTrack.currentTime = 0;
            this.#isPlaying = false;
        } catch (error) {
            console.error('Failed to stop background music:', error);
        }
    }

    /**
     * Sets the volume level
     * @param {number} level - Volume level (0-1)
     */
    setVolume(level) {
        this.#volume = Math.max(0, Math.min(1, level));
        if (this.#currentTrack) {
            this.#currentTrack.volume = this.#volume;
        }
    }

    /**
     * @private
     * Handles fade in transition
     * @param {HTMLAudioElement} track - Audio element to fade in
     * @param {number} duration - Fade duration in milliseconds
     * @returns {Promise<void>}
     */
    async #fadeIn(track, duration) {
        return new Promise(resolve => {
            let startTime = performance.now();
            
            const fadeStep = () => {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                track.volume = progress * this.#volume;
                
                if (progress < 1) {
                    requestAnimationFrame(fadeStep);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(fadeStep);
        });
    }

    /**
     * @private
     * Handles fade out transition
     * @param {HTMLAudioElement} track - Audio element to fade out
     * @param {number} duration - Fade duration in milliseconds
     * @returns {Promise<void>}
     */
    async #fadeOut(track, duration) {
        return new Promise(resolve => {
            const startVolume = track.volume;
            let startTime = performance.now();
            
            const fadeStep = () => {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                track.volume = startVolume * (1 - progress);
                
                if (progress < 1) {
                    requestAnimationFrame(fadeStep);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(fadeStep);
        });
    }

    /**
     * @private
     * Sets up event listeners for audio events
     */
    #setupEventListeners() {
        window.addEventListener('blur', () => {
            if (this.#currentTrack) {
                this.#currentTrack.volume = this.#volume * 0.5;
            }
        });

        window.addEventListener('focus', () => {
            if (this.#currentTrack) {
                this.#currentTrack.volume = this.#volume;
            }
        });
    }

    /**
     * @private
     * Handles playback errors
     * @param {Error} error - The error that occurred
     */
    #handlePlaybackError(error) {
        // Reset state
        this.#isPlaying = false;
        this.#currentTrack = null;
        this.#currentTrackUrl = null;

        // Emit error event for monitoring
        const errorEvent = new CustomEvent('backgroundMusicError', {
            detail: { error, timestamp: new Date() }
        });
        window.dispatchEvent(errorEvent);
    }

    /**
     * Checks if background music is currently playing
     * @returns {boolean}
     */
    isPlaying() {
        return this.#isPlaying;
    }

    /**
     * Gets the current volume level
     * @returns {number}
     */
    getVolume() {
        return this.#volume;
    }

    /**
     * Cleans up resources and removes event listeners
     */
    dispose() {
        if (this.#currentTrack) {
            this.#currentTrack.pause();
            this.#currentTrack.src = '';
            this.#currentTrack = null;
        }
        this.#currentTrackUrl = null;
        this.#isPlaying = false;
    }
}

export default BackgroundMusic;