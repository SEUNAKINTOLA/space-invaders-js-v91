/**
 * @fileoverview Canvas management system with game loop implementation
 * @module core/Canvas
 */

/**
 * @typedef {Object} CanvasConfig
 * @property {number} width - Canvas width in pixels
 * @property {number} height - Canvas height in pixels
 * @property {string} [backgroundColor='#000000'] - Canvas background color
 * @property {number} [fps=60] - Target frames per second
 */

/**
 * Manages canvas rendering and game loop functionality
 * @class Canvas
 */
export class Canvas {
    /**
     * @param {HTMLCanvasElement|string} canvasElement - Canvas element or its ID
     * @param {CanvasConfig} config - Canvas configuration
     * @throws {Error} If canvas element is not found or context cannot be created
     */
    constructor(canvasElement, config = {}) {
        this.canvas = typeof canvasElement === 'string' 
            ? document.getElementById(canvasElement)
            : canvasElement;

        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }

        // Initialize canvas context
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Failed to get 2D context');
        }

        // Configure canvas properties
        this.config = {
            width: config.width || window.innerWidth,
            height: config.height || window.innerHeight,
            backgroundColor: config.backgroundColor || '#000000',
            fps: config.fps || 60
        };

        // Game loop properties
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / this.config.fps;
        this.accumulator = 0;

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleResize = this.handleResize.bind(this);

        // Initialize canvas
        this.initialize();
    }

    /**
     * Initializes canvas setup and event listeners
     * @private
     */
    initialize() {
        this.setDimensions();
        window.addEventListener('resize', this.handleResize);
        this.clear();
    }

    /**
     * Sets canvas dimensions and scales for pixel ratio
     * @private
     */
    setDimensions() {
        const pixelRatio = window.devicePixelRatio || 1;
        
        this.canvas.width = this.config.width * pixelRatio;
        this.canvas.height = this.config.height * pixelRatio;
        
        this.canvas.style.width = `${this.config.width}px`;
        this.canvas.style.height = `${this.config.height}px`;
        
        this.ctx.scale(pixelRatio, pixelRatio);
    }

    /**
     * Handles window resize events
     * @private
     */
    handleResize() {
        this.setDimensions();
        this.clear();
    }

    /**
     * Clears the canvas
     * @public
     */
    clear() {
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    }

    /**
     * Starts the game loop
     * @public
     * @param {Function} updateFn - Update function for game logic
     * @param {Function} renderFn - Render function for drawing
     * @throws {Error} If loop is already running or callbacks are invalid
     */
    start(updateFn, renderFn) {
        if (this.isRunning) {
            throw new Error('Game loop is already running');
        }

        if (typeof updateFn !== 'function' || typeof renderFn !== 'function') {
            throw new Error('Update and render must be valid functions');
        }

        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Stops the game loop
     * @public
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Main game loop implementation
     * @private
     * @param {number} currentTime - Current timestamp
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastFrameTime;
        this.accumulator += deltaTime;

        while (this.accumulator >= this.frameInterval) {
            try {
                this.updateFn(this.frameInterval / 1000); // Convert to seconds
                this.accumulator -= this.frameInterval;
            } catch (error) {
                console.error('Error in update loop:', error);
                this.stop();
                return;
            }
        }

        try {
            this.clear();
            this.renderFn(this.ctx);
        } catch (error) {
            console.error('Error in render loop:', error);
            this.stop();
            return;
        }

        this.lastFrameTime = currentTime;
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Cleans up resources and event listeners
     * @public
     */
    destroy() {
        this.stop();
        window.removeEventListener('resize', this.handleResize);
    }

    /**
     * Gets the current canvas context
     * @public
     * @returns {CanvasRenderingContext2D}
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Gets the canvas dimensions
     * @public
     * @returns {{width: number, height: number}}
     */
    getDimensions() {
        return {
            width: this.config.width,
            height: this.config.height
        };
    }
}

// Export a factory function for easier instantiation
export const createCanvas = (element, config) => new Canvas(element, config);