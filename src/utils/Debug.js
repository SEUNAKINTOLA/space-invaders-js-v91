/**
 * @fileoverview Debug utilities for game development and performance monitoring
 * @module Debug
 * @version 1.0.0
 */

/**
 * @typedef {Object} DebugConfig
 * @property {boolean} enabled - Master switch for debug features
 * @property {boolean} showFPS - Show FPS counter
 * @property {boolean} showColliders - Show collision boundaries
 * @property {boolean} showGrid - Show debug grid
 * @property {boolean} logPerformance - Log performance metrics
 */

/**
 * Debug class providing development and troubleshooting utilities
 * @class Debug
 */
class Debug {
    /**
     * @private
     * @type {DebugConfig}
     */
    static #config = {
        enabled: false,
        showFPS: false,
        showColliders: false,
        showGrid: false,
        logPerformance: false
    };

    /**
     * @private
     * @type {Object}
     */
    static #metrics = {
        fps: 0,
        frameTime: 0,
        lastFrameTime: performance.now(),
        frames: 0,
        lastFPSUpdate: 0
    };

    /**
     * Initialize debug system
     * @param {Partial<DebugConfig>} config - Debug configuration options
     * @throws {Error} If invalid configuration is provided
     */
    static initialize(config = {}) {
        try {
            Debug.#validateConfig(config);
            Debug.#config = { ...Debug.#config, ...config };
            
            if (Debug.#config.enabled) {
                console.info('Debug mode initialized:', Debug.#config);
                Debug.#setupEventListeners();
            }
        } catch (error) {
            console.error('Failed to initialize debug system:', error);
            throw error;
        }
    }

    /**
     * Update debug metrics
     * @param {number} timestamp - Current game loop timestamp
     */
    static update(timestamp) {
        if (!Debug.#config.enabled) return;

        try {
            const currentTime = performance.now();
            Debug.#metrics.frameTime = currentTime - Debug.#metrics.lastFrameTime;
            Debug.#metrics.lastFrameTime = currentTime;
            Debug.#metrics.frames++;

            // Update FPS counter every second
            if (currentTime - Debug.#metrics.lastFPSUpdate >= 1000) {
                Debug.#metrics.fps = Debug.#metrics.frames;
                Debug.#metrics.frames = 0;
                Debug.#metrics.lastFPSUpdate = currentTime;

                if (Debug.#config.logPerformance) {
                    console.debug(`FPS: ${Debug.#metrics.fps}, Frame Time: ${Debug.#metrics.frameTime.toFixed(2)}ms`);
                }
            }
        } catch (error) {
            console.warn('Error updating debug metrics:', error);
        }
    }

    /**
     * Render debug information on canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    static render(ctx) {
        if (!Debug.#config.enabled || !ctx) return;

        try {
            if (Debug.#config.showFPS) {
                Debug.#renderFPS(ctx);
            }

            if (Debug.#config.showGrid) {
                Debug.#renderGrid(ctx);
            }
        } catch (error) {
            console.warn('Error rendering debug information:', error);
        }
    }

    /**
     * Log debug message with timestamp
     * @param {string} message - Debug message
     * @param {any} [data] - Additional debug data
     */
    static log(message, data = null) {
        if (!Debug.#config.enabled) return;

        const timestamp = new Date().toISOString();
        console.debug(`[${timestamp}] ${message}`, data || '');
    }

    /**
     * @private
     * Validate debug configuration
     * @param {Partial<DebugConfig>} config
     * @throws {Error} If configuration is invalid
     */
    static #validateConfig(config) {
        const validKeys = ['enabled', 'showFPS', 'showColliders', 'showGrid', 'logPerformance'];
        
        Object.keys(config).forEach(key => {
            if (!validKeys.includes(key)) {
                throw new Error(`Invalid debug configuration key: ${key}`);
            }
            if (typeof config[key] !== 'boolean') {
                throw new Error(`Debug configuration value must be boolean: ${key}`);
            }
        });
    }

    /**
     * @private
     * Render FPS counter
     * @param {CanvasRenderingContext2D} ctx
     */
    static #renderFPS(ctx) {
        ctx.save();
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.font = '16px monospace';
        ctx.fillText(`FPS: ${Debug.#metrics.fps}`, 10, 20);
        ctx.strokeText(`FPS: ${Debug.#metrics.fps}`, 10, 20);
        ctx.restore();
    }

    /**
     * @private
     * Render debug grid
     * @param {CanvasRenderingContext2D} ctx
     */
    static #renderGrid(ctx) {
        const gridSize = 32;
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();

        for (let x = 0; x <= width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }

        for (let y = 0; y <= height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }

        ctx.stroke();
        ctx.restore();
    }

    /**
     * @private
     * Setup debug keyboard shortcuts
     */
    static #setupEventListeners() {
        window.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.shiftKey) {
                switch (event.key.toLowerCase()) {
                    case 'f':
                        Debug.#config.showFPS = !Debug.#config.showFPS;
                        Debug.log('FPS display toggled');
                        break;
                    case 'g':
                        Debug.#config.showGrid = !Debug.#config.showGrid;
                        Debug.log('Grid display toggled');
                        break;
                    case 'c':
                        Debug.#config.showColliders = !Debug.#config.showColliders;
                        Debug.log('Collider display toggled');
                        break;
                }
            }
        });
    }

    /**
     * Get current debug metrics
     * @returns {Object} Current debug metrics
     */
    static getMetrics() {
        return { ...Debug.#metrics };
    }

    /**
     * Get current debug configuration
     * @returns {DebugConfig} Current debug configuration
     */
    static getConfig() {
        return { ...Debug.#config };
    }
}

export default Debug;