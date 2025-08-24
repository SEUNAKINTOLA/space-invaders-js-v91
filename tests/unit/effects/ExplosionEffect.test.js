/**
 * @fileoverview Unit tests for ExplosionEffect particle system
 * @jest-environment jsdom
 */

import { ExplosionEffect } from '../../../src/effects/ExplosionEffect';
import { ParticleSystem } from '../../../src/effects/ParticleSystem';
import { Vector2D } from '../../../src/math/Vector2D';

describe('ExplosionEffect', () => {
    let explosionEffect;
    let mockCanvas;
    let mockContext;

    // Test constants
    const DEFAULT_POSITION = { x: 100, y: 100 };
    const DEFAULT_PARTICLE_COUNT = 50;
    const DEFAULT_DURATION = 1000; // milliseconds
    
    beforeEach(() => {
        // Mock canvas and context
        mockCanvas = document.createElement('canvas');
        mockContext = mockCanvas.getContext('2d');
        
        // Initialize explosion effect with default parameters
        explosionEffect = new ExplosionEffect({
            position: DEFAULT_POSITION,
            particleCount: DEFAULT_PARTICLE_COUNT,
            duration: DEFAULT_DURATION,
            context: mockContext
        });
    });

    afterEach(() => {
        // Cleanup
        jest.clearAllMocks();
        explosionEffect = null;
    });

    describe('Constructor', () => {
        test('should create explosion effect with default parameters', () => {
            expect(explosionEffect).toBeInstanceOf(ExplosionEffect);
            expect(explosionEffect).toBeInstanceOf(ParticleSystem);
            expect(explosionEffect.getParticleCount()).toBe(DEFAULT_PARTICLE_COUNT);
        });

        test('should throw error when created without required parameters', () => {
            expect(() => new ExplosionEffect()).toThrow('Required parameters missing');
        });

        test('should throw error when created with invalid context', () => {
            expect(() => new ExplosionEffect({
                position: DEFAULT_POSITION,
                context: null
            })).toThrow('Valid canvas context required');
        });
    });

    describe('Particle Generation', () => {
        test('should generate correct number of particles', () => {
            explosionEffect.init();
            expect(explosionEffect.getActiveParticles().length).toBe(DEFAULT_PARTICLE_COUNT);
        });

        test('should generate particles with random velocities within bounds', () => {
            explosionEffect.init();
            const particles = explosionEffect.getActiveParticles();
            
            particles.forEach(particle => {
                expect(particle.velocity.magnitude()).toBeLessThanOrEqual(explosionEffect.maxInitialVelocity);
                expect(particle.velocity.magnitude()).toBeGreaterThan(0);
            });
        });

        test('should position all particles at explosion center initially', () => {
            explosionEffect.init();
            const particles = explosionEffect.getActiveParticles();
            
            particles.forEach(particle => {
                expect(particle.position).toEqual(expect.objectContaining(DEFAULT_POSITION));
            });
        });
    });

    describe('Update Logic', () => {
        test('should update particle positions based on delta time', () => {
            explosionEffect.init();
            const initialPositions = explosionEffect.getActiveParticles()
                .map(p => new Vector2D(p.position.x, p.position.y));
            
            explosionEffect.update(16); // Simulate 16ms frame
            
            explosionEffect.getActiveParticles().forEach((particle, index) => {
                expect(particle.position).not.toEqual(initialPositions[index]);
            });
        });

        test('should apply gravity effect to particles', () => {
            explosionEffect.init();
            const particle = explosionEffect.getActiveParticles()[0];
            const initialVelocityY = particle.velocity.y;
            
            explosionEffect.update(16);
            
            expect(particle.velocity.y).toBeGreaterThan(initialVelocityY);
        });

        test('should decrease particle lifetime', () => {
            explosionEffect.init();
            const particle = explosionEffect.getActiveParticles()[0];
            const initialLifetime = particle.lifetime;
            
            explosionEffect.update(100);
            
            expect(particle.lifetime).toBeLessThan(initialLifetime);
        });
    });

    describe('Effect Lifecycle', () => {
        test('should mark effect as complete when duration expires', () => {
            explosionEffect.init();
            
            // Fast-forward time to just before completion
            explosionEffect.update(DEFAULT_DURATION - 1);
            expect(explosionEffect.isComplete()).toBeFalsy();
            
            // Update to complete
            explosionEffect.update(1);
            expect(explosionEffect.isComplete()).toBeTruthy();
        });

        test('should remove dead particles', () => {
            explosionEffect.init();
            const initialCount = explosionEffect.getActiveParticles().length;
            
            // Update until some particles die
            explosionEffect.update(DEFAULT_DURATION / 2);
            
            expect(explosionEffect.getActiveParticles().length).toBeLessThan(initialCount);
        });
    });

    describe('Performance', () => {
        test('should handle large number of particles efficiently', () => {
            const largeExplosion = new ExplosionEffect({
                position: DEFAULT_POSITION,
                particleCount: 1000,
                duration: DEFAULT_DURATION,
                context: mockContext
            });

            const start = performance.now();
            largeExplosion.init();
            largeExplosion.update(16);
            const end = performance.now();

            expect(end - start).toBeLessThan(16); // Should process within one frame
        });
    });
});