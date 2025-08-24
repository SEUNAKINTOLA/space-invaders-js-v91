/**
 * @fileoverview Core rendering system and game loop implementation
 * Handles canvas setup, rendering lifecycle, and frame management
 * @module core/Renderer
 */

// Constants for renderer configuration
const FRAME_RATE = 60;
const FRAME_TIME = 1000 / FRAME_RATE;
const MAX_FRAME_SKIP = 5;

/**
 * @typedef {Object} RendererConfig
 * @property {number} width - Canvas width in pixels
 * @property {number} height - Canvas height in pixels
 * @property {string} containerId - DOM container ID for canvas
 * @property {boolean} [smoothing=false] - Enable image smoothing
 * @property {number} [scale=1] - Canvas scaling factor
 */

/**
 * Core rendering system managing canvas operations and game loop
 */
export class Renderer {
    /**
     * @param {RendererConfig} config - Renderer configuration
     * @throws {Error} If canvas initialization fails
     */
    constructor(config) {
        this.validateConfig(config);
        
        /** @private */
        this._width = config.width;
        /** @private */
        this._height = config.height;
        /** @private */
        this._scale = config.scale || 1;
        /** @private */
        this._isRunning = false;
        /** @private */
        this._lastTimestamp = 0;
        /** @private */
        this._accumulator = 0;
        /** @private */
        this._frameCount = 0;
        /** @private */
        this._fpsTime = 0;
        /** @private */
        this._currentFps = 0;
        
        this.initializeCanvas(config);
    }

    /**
     * Validates renderer configuration
     * @private
     * @param {RendererConfig} config 
     * @throws {Error} If configuration is invalid
     */
    validateConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('Invalid renderer configuration');
        }
        if (!Number.isFinite(config.width) || config.width <= 0) {
            throw new Error('Invalid canvas width');
        }
        if (!Number.isFinite(config.height) || config.height <= 0) {
            throw new Error('Invalid canvas height');
        }
        if (!config.containerId || typeof config.containerId !== 'string') {
            throw new Error('Invalid container ID');
        }
    }

    /**
     * Initializes canvas and context
     * @private
     * @param {RendererConfig} config 
     * @throws {Error} If canvas initialization fails
     */
    initializeCanvas(config) {
        try {
            const container = document.getElementById(config.containerId);
            if (!container) {
                throw new Error(`Container with ID '${config.containerId}' not found`);
            }

            this._canvas = document.createElement('canvas');
            this._canvas.width = this._width * this._scale;
            this._canvas.height = this._height * this._scale;
            container.appendChild(this._canvas);

            this._context = this._canvas.getContext('2d', {
                alpha: false,
                desynchronized: true
            });

            if (!this._context) {
                throw new Error('Failed to get 2D context');
            }

            this._context.imageSmoothingEnabled = config.smoothing ?? false;
            this._context.scale(this._scale, this._scale);
        } catch (error) {
            throw new Error(`Canvas initialization failed: ${error.message}`);
        }
    }

    /**
     * Starts the render loop
     * @param {Function} updateFn - Game update function
     * @param {Function} renderFn - Game render function
     * @throws {Error} If loop is already running or invalid functions provided
     */
    start(updateFn, renderFn) {
        if (this._isRunning) {
            throw new Error('Renderer is already running');
        }
        if (typeof updateFn !== 'function' || typeof renderFn !== 'function') {
            throw new Error('Invalid update or render function');
        }

        this._updateFn = updateFn;
        this._renderFn = renderFn;
        this._isRunning = true;
        this._lastTimestamp = performance.now();
        
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    /**
     * Stops the render loop
     */
    stop() {
        this._isRunning = false;
    }

    /**
     * Main game loop implementation
     * @private
     * @param {DOMHighResTimeStamp} timestamp 
     */
    gameLoop(timestamp) {
        if (!this._isRunning) return;

        const deltaTime = timestamp - this._lastTimestamp;
        this._lastTimestamp = timestamp;

        // FPS calculation
        this._fpsTime += deltaTime;
        this._frameCount++;
        if (this._fpsTime >= 1000) {
            this._currentFps = this._frameCount;
            this._frameCount = 0;
            this._fpsTime -= 1000;
        }

        // Fixed timestep accumulator
        this._accumulator += deltaTime;
        let updateCount = 0;

        // Update loop with frame skip protection
        while (this._accumulator >= FRAME_TIME && updateCount < MAX_FRAME_SKIP) {
            try {
                this._updateFn(FRAME_TIME);
                this._accumulator -= FRAME_TIME;
                updateCount++;
            } catch (error) {
                console.error('Update error:', error);
                this.stop();
                return;
            }
        }

        // Render frame
        try {
            this.clear();
            this._renderFn(this._context);
        } catch (error) {
            console.error('Render error:', error);
            this.stop();
            return;
        }

        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    /**
     * Clears the canvas
     * @private
     */
    clear() {
        this._context.clearRect(0, 0, this._width, this._height);
    }

    /**
     * Gets current FPS
     * @returns {number} Current frames per second
     */
    getFps() {
        return this._currentFps;
    }

    /**
     * Gets canvas context
     * @returns {CanvasRenderingContext2D} Canvas 2D context
     */
    getContext() {
        return this._context;
    }

    /**
     * Resizes the canvas
     * @param {number} width - New width in pixels
     * @param {number} height - New height in pixels
     * @throws {Error} If invalid dimensions provided
     */
    resize(width, height) {
        if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
            throw new Error('Invalid dimensions');
        }

        this._width = width;
        this._height = height;
        this._canvas.width = width * this._scale;
        this._canvas.height = height * this._scale;
        this._context.scale(this._scale, this._scale);
    }
}