/**
 * @fileoverview Core game loop and canvas rendering system
 * Implements a fixed time step game loop with interpolation for smooth rendering
 * @module core/GameLoop
 */

// Constants for game loop timing
const FIXED_TIME_STEP = 1000 / 60; // 60 FPS
const MAX_FRAME_TIME = 250; // Maximum frame time to prevent spiral of death

/**
 * @typedef {Object} GameLoopConfig
 * @property {HTMLCanvasElement} canvas - The canvas element to render to
 * @property {Function} update - Update function for game logic
 * @property {Function} render - Render function for game graphics
 * @property {number} [targetFPS=60] - Target frames per second
 */

/**
 * Manages the core game loop and rendering system
 * @class GameLoop
 */
export class GameLoop {
    /**
     * @param {GameLoopConfig} config - Configuration options for the game loop
     * @throws {Error} If required configuration parameters are missing
     */
    constructor(config) {
        this._validateConfig(config);

        // Core properties
        this.canvas = config.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.update = config.update;
        this.render = config.render;
        
        // Timing properties
        this.targetFPS = config.targetFPS || 60;
        this.frameTime = 1000 / this.targetFPS;
        this.accumulator = 0;
        this.lastTime = 0;
        this.running = false;

        // Performance metrics
        this.fps = 0;
        this.frameCount = 0;
        this.lastFPSUpdate = 0;

        // Bind methods to preserve context
        this._loop = this._loop.bind(this);
        this._handleVisibilityChange = this._handleVisibilityChange.bind(this);

        // Setup visibility change handling
        document.addEventListener('visibilitychange', this._handleVisibilityChange);
    }

    /**
     * Validates the configuration object
     * @private
     * @param {GameLoopConfig} config - Configuration to validate
     * @throws {Error} If configuration is invalid
     */
    _validateConfig(config) {
        if (!config) {
            throw new Error('GameLoop configuration is required');
        }
        if (!(config.canvas instanceof HTMLCanvasElement)) {
            throw new Error('Valid canvas element is required');
        }
        if (typeof config.update !== 'function') {
            throw new Error('Update function is required');
        }
        if (typeof config.render !== 'function') {
            throw new Error('Render function is required');
        }
    }

    /**
     * Starts the game loop
     * @public
     * @returns {void}
     */
    start() {
        if (this.running) return;
        
        this.running = true;
        this.lastTime = performance.now();
        this.lastFPSUpdate = this.lastTime;
        requestAnimationFrame(this._loop);
    }

    /**
     * Stops the game loop
     * @public
     * @returns {void}
     */
    stop() {
        this.running = false;
    }

    /**
     * Main loop function
     * @private
     * @param {number} currentTime - Current timestamp
     */
    _loop(currentTime) {
        if (!this.running) return;

        // Calculate frame time and update FPS counter
        let frameTime = currentTime - this.lastTime;
        frameTime = Math.min(frameTime, MAX_FRAME_TIME);
        this.lastTime = currentTime;

        // Update FPS counter
        this.frameCount++;
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }

        // Update game state with fixed time step
        this.accumulator += frameTime;
        while (this.accumulator >= FIXED_TIME_STEP) {
            try {
                this.update(FIXED_TIME_STEP / 1000);
                this.accumulator -= FIXED_TIME_STEP;
            } catch (error) {
                console.error('Error in update loop:', error);
                this.stop();
                throw error;
            }
        }

        // Calculate interpolation for smooth rendering
        const alpha = this.accumulator / FIXED_TIME_STEP;

        // Clear canvas and render frame
        try {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.render(this.ctx, alpha);
        } catch (error) {
            console.error('Error in render loop:', error);
            this.stop();
            throw error;
        }

        // Schedule next frame
        requestAnimationFrame(this._loop);
    }

    /**
     * Handles page visibility changes
     * @private
     * @param {Event} event - Visibility change event
     */
    _handleVisibilityChange(event) {
        if (document.hidden) {
            this.stop();
        } else if (!this.running) {
            this.start();
        }
    }

    /**
     * Cleans up resources and event listeners
     * @public
     */
    destroy() {
        this.stop();
        document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    }

    /**
     * Gets current FPS
     * @public
     * @returns {number} Current frames per second
     */
    getFPS() {
        return this.fps;
    }
}

/**
 * Creates and configures a new GameLoop instance
 * @param {GameLoopConfig} config - Configuration options
 * @returns {GameLoop} Configured GameLoop instance
 */
export function createGameLoop(config) {
    return new GameLoop(config);
}