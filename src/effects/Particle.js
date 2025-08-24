/**
 * @fileoverview Particle system implementation for visual effects and animations.
 * Optimized for performance with pooling and efficient memory management.
 * @module effects/Particle
 */

/**
 * @typedef {Object} ParticleConfig
 * @property {number} x - Initial X position
 * @property {number} y - Initial Y position
 * @property {number} [size=2] - Particle size in pixels
 * @property {number} [lifetime=1000] - Lifetime in milliseconds
 * @property {string} [color='#ffffff'] - Particle color in hex
 * @property {number} [speed=1] - Movement speed multiplier
 * @property {number} [angle=0] - Movement angle in radians
 * @property {number} [gravity=0] - Gravity effect (pixels/frame²)
 * @property {number} [alpha=1] - Initial opacity
 */

/**
 * Represents a single particle in the particle system.
 * Implements object pooling for better performance.
 */
class Particle {
    /**
     * @type {Particle[]}
     * @private
     */
    static #pool = [];

    /**
     * @type {number}
     * @private
     */
    static #poolSize = 1000;

    /**
     * Creates or reuses a particle instance from the pool
     * @param {ParticleConfig} config - Particle configuration
     * @returns {Particle} A new or recycled particle instance
     */
    static create(config) {
        const particle = this.#pool.pop() || new Particle();
        particle.init(config);
        return particle;
    }

    /**
     * Returns a particle to the pool for reuse
     * @param {Particle} particle - Particle to recycle
     */
    static recycle(particle) {
        if (this.#pool.length < this.#poolSize) {
            this.#pool.push(particle);
        }
    }

    constructor() {
        // Initialize default properties
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.size = 2;
        this.color = '#ffffff';
        this.alpha = 1;
        this.gravity = 0;
        this.drag = 0.98;
        this.lifetime = 1000;
        this.elapsed = 0;
        this.active = false;
    }

    /**
     * Initializes particle with new configuration
     * @param {ParticleConfig} config - Particle configuration
     * @private
     */
    init(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('Invalid particle configuration');
        }

        const {
            x, y,
            size = 2,
            lifetime = 1000,
            color = '#ffffff',
            speed = 1,
            angle = 0,
            gravity = 0,
            alpha = 1
        } = config;

        // Validate required parameters
        if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Particle position (x, y) must be numbers');
        }

        // Set position
        this.x = x;
        this.y = y;

        // Set velocity based on angle and speed
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Set other properties
        this.size = size;
        this.color = color;
        this.alpha = alpha;
        this.gravity = gravity;
        this.lifetime = lifetime;
        this.elapsed = 0;
        this.active = true;
    }

    /**
     * Updates particle state for the current frame
     * @param {number} deltaTime - Time elapsed since last frame in milliseconds
     * @returns {boolean} Whether the particle is still active
     */
    update(deltaTime) {
        if (!this.active) return false;

        this.elapsed += deltaTime;

        if (this.elapsed >= this.lifetime) {
            this.active = false;
            Particle.recycle(this);
            return false;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Apply gravity
        this.vy += this.gravity;

        // Apply drag
        this.vx *= this.drag;
        this.vy *= this.drag;

        // Update alpha based on lifetime
        this.alpha = 1 - (this.elapsed / this.lifetime);

        return true;
    }

    /**
     * Renders the particle to a canvas context
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    render(ctx) {
        if (!this.active) return;

        try {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } catch (error) {
            console.error('Error rendering particle:', error);
        }
    }

    /**
     * Deactivates the particle and returns it to the pool
     */
    destroy() {
        this.active = false;
        Particle.recycle(this);
    }
}

// Freeze the class to prevent modifications
Object.freeze(Particle);

export default Particle;