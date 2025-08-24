/**
 * @jest-environment jsdom
 */

import { ParticleEmitter } from '../../../src/effects/ParticleEmitter';
import { Vector2D } from '../../../src/math/Vector2D';
import { ParticleConfig } from '../../../src/effects/ParticleConfig';

/**
 * Mock canvas and context for testing
 */
const mockContext = {
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn()
};

const mockCanvas = {
    getContext: jest.fn(() => mockContext),
    width: 800,
    height: 600
};

describe('ParticleEmitter', () => {
    let emitter;
    let defaultConfig;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        
        defaultConfig = new ParticleConfig({
            position: new Vector2D(400, 300),
            particleCount: 50,
            particleLifetime: 2000,
            particleSize: 5,
            spread: 360,
            speed: 200,
            colors: ['#FF0000', '#FF7F00', '#FFFF00'],
            gravity: 9.8,
            opacity: 1.0
        });

        emitter = new ParticleEmitter(mockCanvas, defaultConfig);
    });

    describe('Constructor', () => {
        test('should create a ParticleEmitter with default configuration', () => {
            expect(emitter).toBeDefined();
            expect(emitter.isActive()).toBeFalsy();
            expect(emitter.getParticleCount()).toBe(0);
        });

        test('should throw error when canvas is null', () => {
            expect(() => new ParticleEmitter(null, defaultConfig))
                .toThrow('Canvas element is required');
        });

        test('should throw error when config is invalid', () => {
            expect(() => new ParticleEmitter(mockCanvas, null))
                .toThrow('Valid particle configuration is required');
        });
    });

    describe('Emission Control', () => {
        test('should emit particles when start is called', () => {
            emitter.start();
            expect(emitter.isActive()).toBeTruthy();
            expect(emitter.getParticleCount()).toBe(defaultConfig.particleCount);
        });

        test('should stop emission when stop is called', () => {
            emitter.start();
            emitter.stop();
            expect(emitter.isActive()).toBeFalsy();
        });

        test('should clear all particles when reset is called', () => {
            emitter.start();
            emitter.reset();
            expect(emitter.getParticleCount()).toBe(0);
        });
    });

    describe('Particle Lifecycle', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('should remove particles after lifetime expires', () => {
            emitter.start();
            const initialCount = emitter.getParticleCount();
            
            // Advance time to just before particle lifetime
            jest.advanceTimersByTime(defaultConfig.particleLifetime - 100);
            emitter.update(defaultConfig.particleLifetime - 100);
            expect(emitter.getParticleCount()).toBe(initialCount);

            // Advance time past particle lifetime
            jest.advanceTimersByTime(200);
            emitter.update(200);
            expect(emitter.getParticleCount()).toBe(0);
        });

        test('should apply gravity to particles over time', () => {
            emitter.start();
            const particle = emitter.getParticles()[0];
            const initialVelocityY = particle.velocity.y;

            emitter.update(1000);
            expect(particle.velocity.y).toBeGreaterThan(initialVelocityY);
        });
    });

    describe('Rendering', () => {
        test('should call correct canvas context methods when rendering', () => {
            emitter.start();
            emitter.render();

            expect(mockContext.beginPath).toHaveBeenCalled();
            expect(mockContext.arc).toHaveBeenCalled();
            expect(mockContext.fill).toHaveBeenCalled();
        });

        test('should apply correct opacity based on particle lifetime', () => {
            emitter.start();
            emitter.update(defaultConfig.particleLifetime / 2);
            emitter.render();

            // Expect opacity to be around 0.5 at half lifetime
            expect(mockContext.globalAlpha).toBeCloseTo(0.5, 1);
        });
    });

    describe('Performance', () => {
        test('should handle large number of particles efficiently', () => {
            const heavyConfig = new ParticleConfig({
                ...defaultConfig,
                particleCount: 1000
            });

            const start = performance.now();
            const heavyEmitter = new ParticleEmitter(mockCanvas, heavyConfig);
            heavyEmitter.start();
            heavyEmitter.update(16); // One frame at 60fps
            heavyEmitter.render();
            const end = performance.now();

            // Ensure processing time is reasonable (less than 16ms for 60fps)
            expect(end - start).toBeLessThan(16);
        });
    });

    describe('Configuration Updates', () => {
        test('should update configuration dynamically', () => {
            const newConfig = new ParticleConfig({
                ...defaultConfig,
                particleCount: 100,
                speed: 300
            });

            emitter.updateConfig(newConfig);
            emitter.start();

            expect(emitter.getParticleCount()).toBe(100);
            expect(emitter.getConfig().speed).toBe(300);
        });

        test('should validate configuration updates', () => {
            expect(() => emitter.updateConfig(null))
                .toThrow('Valid particle configuration is required');
        });
    });
});