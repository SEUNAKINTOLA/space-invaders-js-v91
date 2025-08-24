/**
 * @fileoverview Particle Effects System Configuration
 * Defines the core configuration parameters for the particle effects system.
 * Includes presets for different effect types and performance optimization settings.
 * 
 * @module effects/effects.config
 * @version 1.0.0
 */

/**
 * @typedef {Object} ParticlePreset
 * @property {number} count - Number of particles to emit
 * @property {number} lifetime - Particle lifetime in milliseconds
 * @property {number} speed - Base particle speed
 * @property {number} spread - Particle spread angle in radians
 * @property {string[]} colors - Array of possible particle colors
 * @property {number} size - Base particle size in pixels
 * @property {number} sizeVariance - Random variance in particle size
 * @property {number} opacity - Starting opacity (0-1)
 * @property {boolean} fadeOut - Whether particles should fade out over lifetime
 */

/**
 * Performance thresholds for the particle system
 * @constant {Object}
 */
export const PERFORMANCE_THRESHOLDS = Object.freeze({
    MAX_ACTIVE_PARTICLES: 1000,
    MIN_FPS: 30,
    BATCH_SIZE: 100,
    CLEANUP_INTERVAL: 1000, // ms
    OPTIMIZATION_TRIGGER_THRESHOLD: 0.8 // 80% of max particles
});

/**
 * Global particle system settings
 * @constant {Object}
 */
export const SYSTEM_SETTINGS = Object.freeze({
    enabled: true,
    useGPUAcceleration: true,
    useRequestAnimationFrame: true,
    poolSize: 2000,
    debugMode: process.env.NODE_ENV === 'development',
    collisionDetection: false
});

/**
 * Predefined particle effect presets
 * @constant {Object.<string, ParticlePreset>}
 */
export const PARTICLE_PRESETS = Object.freeze({
    explosion: {
        count: 50,
        lifetime: 1000,
        speed: 5,
        spread: Math.PI * 2,
        colors: ['#ff4400', '#ff8800', '#ffaa00', '#ffff00'],
        size: 4,
        sizeVariance: 2,
        opacity: 1,
        fadeOut: true
    },
    sparkle: {
        count: 20,
        lifetime: 800,
        speed: 2,
        spread: Math.PI / 4,
        colors: ['#ffffff', '#ffff00', '#ffffaa'],
        size: 2,
        sizeVariance: 1,
        opacity: 0.8,
        fadeOut: true
    },
    smoke: {
        count: 30,
        lifetime: 2000,
        speed: 1,
        spread: Math.PI / 6,
        colors: ['#666666', '#888888', '#999999'],
        size: 8,
        sizeVariance: 4,
        opacity: 0.6,
        fadeOut: true
    }
});

/**
 * Physics configuration for particle behavior
 * @constant {Object}
 */
export const PHYSICS_CONFIG = Object.freeze({
    gravity: {
        enabled: true,
        value: 9.81
    },
    wind: {
        enabled: false,
        direction: 0,
        strength: 0
    },
    friction: 0.02,
    bounce: 0.5
});

/**
 * Validation functions for particle configurations
 * @namespace
 */
export const validators = {
    /**
     * Validates a particle preset configuration
     * @param {ParticlePreset} preset - The preset to validate
     * @returns {boolean} - Whether the preset is valid
     * @throws {Error} If the preset is invalid
     */
    validatePreset(preset) {
        if (!preset || typeof preset !== 'object') {
            throw new Error('Invalid particle preset configuration');
        }

        const requiredFields = ['count', 'lifetime', 'speed', 'colors', 'size'];
        for (const field of requiredFields) {
            if (!(field in preset)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        if (preset.count > PERFORMANCE_THRESHOLDS.MAX_ACTIVE_PARTICLES) {
            throw new Error('Particle count exceeds maximum threshold');
        }

        return true;
    },

    /**
     * Validates performance settings based on device capabilities
     * @returns {Object} - Optimized settings for the current device
     */
    validatePerformance() {
        const deviceCapabilities = {
            isHighEnd: window.navigator.hardwareConcurrency > 4,
            hasGPU: !!window.WebGLRenderingContext,
            isMobile: /Mobile|Android|iP(hone|od|ad)/.test(navigator.userAgent)
        };

        return {
            useGPUAcceleration: deviceCapabilities.hasGPU && !deviceCapabilities.isMobile,
            maxParticles: deviceCapabilities.isHighEnd 
                ? PERFORMANCE_THRESHOLDS.MAX_ACTIVE_PARTICLES 
                : Math.floor(PERFORMANCE_THRESHOLDS.MAX_ACTIVE_PARTICLES * 0.5),
            batchSize: deviceCapabilities.isMobile 
                ? Math.floor(PERFORMANCE_THRESHOLDS.BATCH_SIZE * 0.5) 
                : PERFORMANCE_THRESHOLDS.BATCH_SIZE
        };
    }
};

/**
 * Default export for the particle system configuration
 */
export default {
    PERFORMANCE_THRESHOLDS,
    SYSTEM_SETTINGS,
    PARTICLE_PRESETS,
    PHYSICS_CONFIG,
    validators
};