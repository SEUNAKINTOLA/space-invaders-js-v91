/**
 * @fileoverview Particle System implementation for visual effects and animations
 * Handles creation, updating, and rendering of particle effects with performance optimizations.
 * @module ParticleSystem
 */

// Constants for performance tuning and configuration
const DEFAULT_CONFIG = {
    MAX_PARTICLES: 1000,
    PARTICLE_LIFETIME: 2000, // milliseconds
    BATCH_SIZE: 100, // particles created per explosion
    OPTIMIZATION_THRESHOLD: 60 // fps threshold for performance optimization
};

/**
 * @typedef {Object} ParticleConfig
 * @property {number} x - Initial X position
 * @property {number} y - Initial Y position
 * @property {number} velocity - Initial velocity
 * @property {number} angle - Direction angle in radians
 * @property {string} color - Particle color (CSS color string)
 * @property {number} size - Particle size in pixels
 * @property {number} lifetime - Particle lifetime in milliseconds
 */

/**
 * Represents a single particle in the system
 * @private
 */
class Particle {
    /**
     * @param {ParticleConfig} config - Particle configuration
     */
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.velocity = config.velocity;
        this.angle = config.angle;
        this.color = config.color;
        this.size = config.size;
        this.lifetime = config.lifetime;
        this.birth = performance.now();
        this.dead = false;
    }

    /**
     * Updates particle position and state
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     * @returns {boolean} - Whether the particle is still alive
     */
    update(deltaTime) {
        if (this.dead) return false;

        const age = performance.now() - this.birth;
        if (age >= this.lifetime) {
            this.dead = true;
            return false;
        }

        // Update position based on velocity and angle
        this.x += Math.cos(this.angle) * this.velocity * (deltaTime / 1000);
        this.y += Math.sin(this.angle) * this.velocity * (deltaTime / 1000);

        // Apply physics (e.g., gravity, drag)
        this.velocity *= 0.98; // air resistance
        return true;
    }
}

/**
 * Main particle system class for managing particle effects
 */
export class ParticleSystem {
    /**
     * @param {Object} options - System configuration options
     * @param {HTMLCanvasElement} options.canvas - Canvas element for rendering
     * @param {Object} [options.config] - Optional system configuration overrides
     * @throws {Error} If required parameters are missing
     */
    constructor(options) {
        if (!options?.canvas) {
            throw new Error('ParticleSystem requires a canvas element');
        }

        this.canvas = options.canvas;
        this.ctx = this.canvas.getContext('2d');
        this.config = { ...DEFAULT_CONFIG, ...options.config };
        this.particles = new Set();
        this.lastUpdate = performance.now();
        this.isRunning = false;
        this.frameCount = 0;
        this.fpsMonitor = new WeakMap();

        // Bind methods
        this.update = this.update.bind(this);
        this.render = this.render.bind(this);
        this.animate = this.animate.bind(this);
    }

    /**
     * Creates a particle explosion effect at specified coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} [options] - Optional effect configuration
     * @returns {void}
     */
    createExplosion(x, y, options = {}) {
        const {
            count = this.config.BATCH_SIZE,
            color = '#FF5733',
            size = 2,
            velocity = 200
        } = options;

        // Performance check
        if (this.particles.size + count > this.config.MAX_PARTICLES) {
            console.warn('Particle limit reached, some particles may be skipped');
        }

        for (let i = 0; i < count; i++) {
            if (this.particles.size >= this.config.MAX_PARTICLES) break;

            const angle = (Math.PI * 2 * i) / count;
            const randomVelocity = velocity * (0.5 + Math.random() * 0.5);
            const particle = new Particle({
                x,
                y,
                velocity: randomVelocity,
                angle,
                color,
                size,
                lifetime: this.config.PARTICLE_LIFETIME * (0.8 + Math.random() * 0.4)
            });

            this.particles.add(particle);
        }
    }

    /**
     * Updates all particles in the system
     * @private
     */
    update() {
        const now = performance.now();
        const deltaTime = now - this.lastUpdate;

        for (const particle of this.particles) {
            if (!particle.update(deltaTime)) {
                this.particles.delete(particle);
            }
        }

        this.lastUpdate = now;
    }

    /**
     * Renders all particles to the canvas
     * @private
     */
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Batch rendering for better performance
        this.ctx.beginPath();
        for (const particle of this.particles) {
            this.ctx.fillStyle = particle.color;
            this.ctx.moveTo(particle.x, particle.y);
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        }
        this.ctx.fill();
    }

    /**
     * Main animation loop
     * @private
     */
    animate() {
        if (!this.isRunning) return;

        this.update();
        this.render();
        this.frameCount++;

        // Performance monitoring
        if (this.frameCount % 60 === 0) {
            this.monitorPerformance();
        }

        requestAnimationFrame(this.animate);
    }

    /**
     * Monitors and optimizes system performance
     * @private
     */
    monitorPerformance() {
        const fps = 1000 / (performance.now() - this.lastUpdate);
        if (fps < this.config.OPTIMIZATION_THRESHOLD) {
            this.optimize();
        }
    }

    /**
     * Applies performance optimizations when needed
     * @private
     */
    optimize() {
        // Remove oldest particles if system is struggling
        if (this.particles.size > this.config.MAX_PARTICLES / 2) {
            const oldestParticles = Array.from(this.particles)
                .sort((a, b) => a.birth - b.birth)
                .slice(0, Math.floor(this.particles.size * 0.2));

            oldestParticles.forEach(particle => this.particles.delete(particle));
        }
    }

    /**
     * Starts the particle system
     * @returns {void}
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastUpdate = performance.now();
        this.animate();
    }

    /**
     * Stops the particle system
     * @returns {void}
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Cleans up resources and stops the system
     * @returns {void}
     */
    dispose() {
        this.stop();
        this.particles.clear();
        this.ctx = null;
    }
}

export default ParticleSystem;