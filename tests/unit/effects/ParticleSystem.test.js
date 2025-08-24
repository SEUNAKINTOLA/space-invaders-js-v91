/**
 * @jest.env canvas
 * @fileoverview Unit tests for the ParticleSystem class
 */

import { ParticleSystem } from '../../../src/effects/ParticleSystem';
import { Particle } from '../../../src/effects/Particle';
import { Vector2D } from '../../../src/math/Vector2D';

// Mock the canvas and context since we're in a test environment
const mockContext = {
    fillStyle: '',
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    clearRect: jest.fn()
};

const mockCanvas = {
    getContext: () => mockContext,
    width: 800,
    height: 600
};

describe('ParticleSystem', () => {
    let particleSystem;
    
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
        particleSystem = new ParticleSystem(mockCanvas);
    });

    describe('initialization', () => {
        test('should create a particle system with default parameters', () => {
            expect(particleSystem).toBeDefined();
            expect(particleSystem.particles).toEqual([]);
            expect(particleSystem.maxParticles).toBe(1000);
        });

        test('should accept custom maximum particles', () => {
            const customSystem = new ParticleSystem(mockCanvas, { maxParticles: 500 });
            expect(customSystem.maxParticles).toBe(500);
        });

        test('should throw error if canvas is invalid', () => {
            expect(() => new ParticleSystem(null))
                .toThrow('Invalid canvas element provided');
        });
    });

    describe('particle emission', () => {
        test('should emit particles at specified position', () => {
            const position = new Vector2D(100, 100);
            particleSystem.emit(position, 10);
            
            expect(particleSystem.particles.length).toBe(10);
            particleSystem.particles.forEach(particle => {
                expect(particle.position.x).toBe(100);
                expect(particle.position.y).toBe(100);
            });
        });

        test('should not exceed maximum particles limit', () => {
            const position = new Vector2D(100, 100);
            particleSystem.emit(position, 2000); // Trying to emit more than max
            
            expect(particleSystem.particles.length).toBe(particleSystem.maxParticles);
        });

        test('should apply initial velocity to emitted particles', () => {
            const position = new Vector2D(100, 100);
            const velocity = new Vector2D(5, 5);
            
            particleSystem.emit(position, 1, { initialVelocity: velocity });
            
            expect(particleSystem.particles[0].velocity.x).toBe(5);
            expect(particleSystem.particles[0].velocity.y).toBe(5);
        });
    });

    describe('update logic', () => {
        test('should update all particles positions', () => {
            const position = new Vector2D(100, 100);
            particleSystem.emit(position, 5);
            
            const deltaTime = 1/60; // 60 FPS
            particleSystem.update(deltaTime);
            
            particleSystem.particles.forEach(particle => {
                expect(particle.position).not.toEqual(position);
            });
        });

        test('should remove dead particles', () => {
            const position = new Vector2D(100, 100);
            particleSystem.emit(position, 5, { lifetime: 0.1 });
            
            // Fast forward time
            particleSystem.update(0.2);
            
            expect(particleSystem.particles.length).toBe(0);
        });

        test('should apply gravity to particles', () => {
            const position = new Vector2D(100, 100);
            particleSystem.emit(position, 1, { 
                initialVelocity: new Vector2D(0, 0)
            });
            
            const deltaTime = 1/60;
            const originalY = particleSystem.particles[0].position.y;
            
            particleSystem.update(deltaTime);
            
            expect(particleSystem.particles[0].position.y).toBeGreaterThan(originalY);
        });
    });

    describe('rendering', () => {
        test('should call context methods for each particle', () => {
            const position = new Vector2D(100, 100);
            particleSystem.emit(position, 5);
            
            particleSystem.render();
            
            expect(mockContext.beginPath).toHaveBeenCalledTimes(5);
            expect(mockContext.arc).toHaveBeenCalledTimes(5);
            expect(mockContext.fill).toHaveBeenCalledTimes(5);
        });

        test('should clear canvas before rendering', () => {
            particleSystem.render();
            
            expect(mockContext.clearRect).toHaveBeenCalledWith(
                0, 0, mockCanvas.width, mockCanvas.height
            );
        });
    });

    describe('performance', () => {
        test('should handle large number of particles efficiently', () => {
            const position = new Vector2D(100, 100);
            const startTime = performance.now();
            
            particleSystem.emit(position, 1000);
            particleSystem.update(1/60);
            particleSystem.render();
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // Ensure processing 1000 particles takes less than 16ms (60 FPS)
            expect(executionTime).toBeLessThan(16);
        });
    });

    describe('error handling', () => {
        test('should handle invalid emission parameters gracefully', () => {
            expect(() => particleSystem.emit(null, 10))
                .toThrow('Invalid emission position');
            
            expect(() => particleSystem.emit(new Vector2D(100, 100), -1))
                .toThrow('Invalid particle count');
        });

        test('should handle invalid update delta time', () => {
            expect(() => particleSystem.update(-1))
                .toThrow('Invalid delta time');
        });
    });
});