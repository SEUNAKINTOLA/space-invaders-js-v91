/**
 * @fileoverview Performance monitoring utilities for game engine
 * Handles FPS tracking, frame timing, and performance metrics
 * @module Performance
 */

/**
 * @constant {number} DEFAULT_SAMPLE_SIZE - Default number of frames to sample for metrics
 * @private
 */
const DEFAULT_SAMPLE_SIZE = 60;

/**
 * @constant {number} MILLISECONDS_PER_SECOND - Milliseconds in a second for FPS calculation
 * @private
 */
const MILLISECONDS_PER_SECOND = 1000;

/**
 * Class responsible for monitoring and analyzing game performance metrics
 */
class Performance {
    /**
     * @constructor
     * @param {Object} config - Configuration options
     * @param {number} [config.sampleSize=60] - Number of frames to sample for metrics
     * @throws {Error} If invalid configuration is provided
     */
    constructor(config = {}) {
        try {
            this.sampleSize = config.sampleSize || DEFAULT_SAMPLE_SIZE;
            this.validateConfig();
            
            // Initialize performance tracking arrays
            this.frameTimes = new Array(this.sampleSize).fill(0);
            this.frameTimeIndex = 0;
            
            // Performance metrics
            this.fps = 0;
            this.averageFrameTime = 0;
            this.minFrameTime = Infinity;
            this.maxFrameTime = 0;
            
            // Timing references
            this.lastFrameTime = performance.now();
            this.frameCount = 0;
            
            // Bind methods
            this.update = this.update.bind(this);
            this.reset = this.reset.bind(this);
        } catch (error) {
            throw new Error(`Performance initialization failed: ${error.message}`);
        }
    }

    /**
     * Validates configuration parameters
     * @private
     * @throws {Error} If configuration is invalid
     */
    validateConfig() {
        if (typeof this.sampleSize !== 'number' || this.sampleSize <= 0) {
            throw new Error('Sample size must be a positive number');
        }
    }

    /**
     * Updates performance metrics for the current frame
     * @public
     * @returns {void}
     */
    update() {
        try {
            const currentTime = performance.now();
            const deltaTime = currentTime - this.lastFrameTime;
            
            // Update frame time tracking
            this.frameTimes[this.frameTimeIndex] = deltaTime;
            this.frameTimeIndex = (this.frameTimeIndex + 1) % this.sampleSize;
            
            // Update metrics
            this.updateMetrics(deltaTime);
            
            // Update timing references
            this.lastFrameTime = currentTime;
            this.frameCount++;
        } catch (error) {
            console.error('Performance update failed:', error);
            // Continue execution but log the error
        }
    }

    /**
     * Updates performance metrics based on the latest frame time
     * @private
     * @param {number} deltaTime - Time elapsed since last frame
     */
    updateMetrics(deltaTime) {
        // Update min/max frame times
        this.minFrameTime = Math.min(this.minFrameTime, deltaTime);
        this.maxFrameTime = Math.max(this.maxFrameTime, deltaTime);
        
        // Calculate average frame time
        const sum = this.frameTimes.reduce((acc, time) => acc + time, 0);
        this.averageFrameTime = sum / this.sampleSize;
        
        // Calculate FPS
        this.fps = Math.round(MILLISECONDS_PER_SECOND / this.averageFrameTime);
    }

    /**
     * Retrieves current performance metrics
     * @public
     * @returns {Object} Current performance metrics
     */
    getMetrics() {
        return {
            fps: this.fps,
            frameTime: {
                average: this.averageFrameTime,
                min: this.minFrameTime,
                max: this.maxFrameTime
            },
            frameCount: this.frameCount
        };
    }

    /**
     * Resets all performance metrics
     * @public
     * @returns {void}
     */
    reset() {
        this.frameTimes.fill(0);
        this.frameTimeIndex = 0;
        this.fps = 0;
        this.averageFrameTime = 0;
        this.minFrameTime = Infinity;
        this.maxFrameTime = 0;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
    }

    /**
     * Checks if performance is meeting target FPS
     * @public
     * @param {number} targetFPS - Target FPS to check against
     * @returns {boolean} Whether performance meets target
     * @throws {Error} If targetFPS is invalid
     */
    isMeetingTarget(targetFPS) {
        if (typeof targetFPS !== 'number' || targetFPS <= 0) {
            throw new Error('Target FPS must be a positive number');
        }
        return this.fps >= targetFPS;
    }
}

// Export as singleton to ensure single instance across application
export default new Performance();