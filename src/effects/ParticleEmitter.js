/**
 * @fileoverview Particle Effects System for visual feedback and animations
 * Implements a high-performance particle emitter with configurable properties
 * and optimized rendering capabilities.
 * 
 * @module ParticleEmitter
 * @author AI Senior Engineer
 * @version 1.0.0
 */

/**
 * @typedef {Object} ParticleConfig
 * @property {number} x - Initial X position
 * @property {number} y - Initial Y position
 * @property {number} [lifetime=2000] - Particle lifetime in milliseconds
 * @property {number} [speed=5] - Particle movement speed
 * @property {number} [size=5] - Particle size in pixels
 * @property {string} [color='#ffffff'] - Particle color in hex
 * @property {number} [spread=360] - Emission spread angle in degrees
 * @property {number} [gravity=0.5] - Gravity effect on particles
 * @property {number} [opacity=1] - Initial particle opacity
 */

/**
 * @typedef {Object} Particle
 * @property {number} x - Current X position
 * @property {number} y - Current Y position
 * @property {number} vx - X velocity
 * @property {number} vy - Y velocity
 * @property {number} life - Current life value
 * @property {number} maxLife - Maximum life value
 * @property {number} size - Particle size
 * @property {string} color - Particle color
 * @property {number} opacity - Current opacity
 */

class ParticleEmitter {
    /**
     * Creates a new particle emitter instance
     * @param {ParticleConfig} config - Configuration options for the emitter
     * @throws {Error} If required configuration parameters are missing
     */
    constructor(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('ParticleEmitter requires a configuration object');
        }

        this.validateConfig(config);

        // Initialize emitter properties
        this.x = config.x;
        this.y = config.y;
        this.lifetime = config.lifetime || 2000;
        this.speed = config.speed || 5;
        this.size = config.size || 5;
        this.color = config.color || '#ffffff';
        this.spread = config.spread || 360;
        this.gravity = config.gravity || 0.5;
        this.opacity = config.opacity || 1;

        // Internal state
        this.particles = new Set();
        this.isActive = false;
        this.lastUpdate = performance.now();

        // Bind methods
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
    }

    /**
     * Validates the configuration object
     * @private
     * @param {ParticleConfig} config - Configuration to validate
     * @throws {Error} If configuration is invalid
     */
    validateConfig(config) {
        if (typeof config.x !== 'number' || typeof config.y !== 'number') {
            throw new Error('Position (x, y) must be specified as numbers');
        }
    }

    /**
     * Starts the particle emitter
     * @param {number} [count=1] - Number of particles to emit
     * @returns {void}
     */
    emit(count = 1) {
        if (count < 1) return;

        for (let i = 0; i < count; i++) {
            this.createParticle();
        }

        if (!this.isActive) {
            this.isActive = true;
            this.animate();
        }
    }

    /**
     * Creates a single particle
     * @private
     * @returns {void}
     */
    createParticle() {
        const angle = (Math.random() * this.spread * Math.PI) / 180;
        const speed = this.speed * (0.5 + Math.random());

        const particle = {
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: this.lifetime,
            maxLife: this.lifetime,
            size: this.size * (0.8 + Math.random() * 0.4),
            color: this.color,
            opacity: this.opacity
        };

        this.particles.add(particle);
    }

    /**
     * Updates particle positions and properties
     * @private
     * @param {number} deltaTime - Time elapsed since last update
     * @returns {void}
     */
    update(deltaTime) {
        for (const particle of this.particles) {
            // Update position
            particle.x += particle.vx * (deltaTime / 16);
            particle.y += particle.vy * (deltaTime / 16);

            // Apply gravity
            particle.vy += this.gravity * (deltaTime / 16);

            // Update lifetime
            particle.life -= deltaTime;
            particle.opacity = (particle.life / particle.maxLife) * this.opacity;

            // Remove dead particles
            if (particle.life <= 0) {
                this.particles.delete(particle);
            }
        }

        // Stop animation if no particles remain
        if (this.particles.size === 0) {
            this.isActive = false;
        }
    }

    /**
     * Renders particles to the provided context
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @returns {void}
     */
    render(ctx) {
        if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
            throw new Error('Valid canvas context required for rendering');
        }

        ctx.save();
        
        for (const particle of this.particles) {
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Animation loop for the particle system
     * @private
     * @returns {void}
     */
    animate() {
        if (!this.isActive) return;

        const now = performance.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;

        this.update(deltaTime);
        requestAnimationFrame(() => this.animate());
    }

    /**
     * Stops the particle emitter and clears all particles
     * @returns {void}
     */
    stop() {
        this.isActive = false;
        this.particles.clear();
    }

    /**
     * Returns the current number of active particles
     * @returns {number} Number of active particles
     */
    get particleCount() {
        return this.particles.size;
    }
}

export default ParticleEmitter;