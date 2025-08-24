/**
 * @fileoverview Particle Effects System for Explosions
 * Implements a high-performance particle system for creating explosion effects
 * with configurable parameters and optimized rendering.
 * 
 * @module ExplosionEffect
 * @author AI Senior Engineer
 * @version 1.0.0
 */

// Constants for default configuration
const DEFAULT_CONFIG = Object.freeze({
    PARTICLE_COUNT: 50,
    PARTICLE_SIZE: 3,
    EXPLOSION_RADIUS: 100,
    PARTICLE_LIFETIME: 1000, // milliseconds
    PARTICLE_COLORS: ['#ff4400', '#ff8800', '#ffaa00', '#ffcc00'],
    GRAVITY: 0.98,
    SPREAD_FACTOR: 0.8
});

/**
 * Represents a single particle in the explosion effect
 * @private
 */
class Particle {
    /**
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {Object} options - Particle configuration options
     */
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.velocity = {
            x: (Math.random() - 0.5) * options.spreadFactor,
            y: (Math.random() - 0.5) * options.spreadFactor
        };
        this.radius = options.size || DEFAULT_CONFIG.PARTICLE_SIZE;
        this.lifetime = options.lifetime || DEFAULT_CONFIG.PARTICLE_LIFETIME;
        this.birth = Date.now();
        this.color = options.colors[Math.floor(Math.random() * options.colors.length)];
        this.alpha = 1;
    }

    /**
     * Updates particle position and properties
     * @param {number} deltaTime - Time elapsed since last update
     * @returns {boolean} - Whether the particle is still alive
     */
    update(deltaTime) {
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        this.velocity.y += DEFAULT_CONFIG.GRAVITY * deltaTime * 0.001;
        
        const age = Date.now() - this.birth;
        this.alpha = Math.max(0, 1 - (age / this.lifetime));
        
        return age < this.lifetime;
    }
}

/**
 * ExplosionEffect class for managing particle-based explosion animations
 */
export class ExplosionEffect {
    /**
     * @param {Object} config - Configuration options for the explosion effect
     * @throws {Error} If invalid configuration parameters are provided
     */
    constructor(config = {}) {
        this.validateConfig(config);
        
        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };
        
        this.particles = [];
        this.isActive = false;
        this.lastUpdate = 0;
        
        // Bind methods to preserve context
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
    }

    /**
     * Validates configuration parameters
     * @private
     * @param {Object} config - Configuration to validate
     * @throws {Error} If configuration is invalid
     */
    validateConfig(config) {
        if (config.PARTICLE_COUNT && config.PARTICLE_COUNT < 0) {
            throw new Error('Particle count must be positive');
        }
        if (config.PARTICLE_SIZE && config.PARTICLE_SIZE <= 0) {
            throw new Error('Particle size must be greater than 0');
        }
    }

    /**
     * Triggers an explosion effect at specified coordinates
     * @param {number} x - X coordinate of explosion center
     * @param {number} y - Y coordinate of explosion center
     * @returns {void}
     */
    trigger(x, y) {
        try {
            this.particles = Array.from({ length: this.config.PARTICLE_COUNT }, 
                () => new Particle(x, y, {
                    spreadFactor: this.config.SPREAD_FACTOR,
                    size: this.config.PARTICLE_SIZE,
                    lifetime: this.config.PARTICLE_LIFETIME,
                    colors: this.config.PARTICLE_COLORS
                })
            );
            
            this.isActive = true;
            this.lastUpdate = Date.now();
        } catch (error) {
            console.error('Failed to trigger explosion effect:', error);
            throw error;
        }
    }

    /**
     * Updates all particles in the effect
     * @returns {boolean} Whether the effect is still active
     */
    update() {
        if (!this.isActive) return false;

        const now = Date.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;

        this.particles = this.particles.filter(particle => particle.update(deltaTime));
        this.isActive = this.particles.length > 0;

        return this.isActive;
    }

    /**
     * Renders the explosion effect to a canvas context
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     * @throws {Error} If context is invalid
     */
    render(ctx) {
        if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
            throw new Error('Invalid rendering context');
        }

        if (!this.isActive) return;

        ctx.save();
        
        this.particles.forEach(particle => {
            ctx.beginPath();
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    /**
     * Cleans up the effect and releases resources
     */
    dispose() {
        this.particles = [];
        this.isActive = false;
    }
}

/**
 * Creates a pre-configured explosion effect instance
 * @param {Object} config - Optional configuration overrides
 * @returns {ExplosionEffect} Configured explosion effect instance
 */
export const createExplosionEffect = (config = {}) => {
    try {
        return new ExplosionEffect(config);
    } catch (error) {
        console.error('Failed to create explosion effect:', error);
        throw error;
    }
};