/**
 * @fileoverview Unit tests for Particle effects system
 * @jest-environment jsdom
 */

import { Particle } from '../../../src/effects/Particle';
import { Vector2D } from '../../../src/math/Vector2D';

describe('Particle', () => {
  let particle;
  const mockPosition = new Vector2D(100, 100);
  const mockVelocity = new Vector2D(2, 2);
  
  beforeEach(() => {
    // Reset the particle instance before each test
    particle = new Particle({
      position: mockPosition,
      velocity: mockVelocity,
      lifetime: 1000,
      color: '#FF0000',
      size: 5
    });
  });

  describe('constructor', () => {
    test('should create a particle with default parameters', () => {
      const defaultParticle = new Particle();
      
      expect(defaultParticle.position).toEqual(new Vector2D(0, 0));
      expect(defaultParticle.velocity).toEqual(new Vector2D(0, 0));
      expect(defaultParticle.lifetime).toBe(1000);
      expect(defaultParticle.color).toBe('#FFFFFF');
      expect(defaultParticle.size).toBe(1);
      expect(defaultParticle.alpha).toBe(1);
      expect(defaultParticle.isAlive).toBe(true);
    });

    test('should create a particle with custom parameters', () => {
      expect(particle.position).toEqual(mockPosition);
      expect(particle.velocity).toEqual(mockVelocity);
      expect(particle.lifetime).toBe(1000);
      expect(particle.color).toBe('#FF0000');
      expect(particle.size).toBe(5);
    });

    test('should throw error for invalid position type', () => {
      expect(() => {
        new Particle({ position: 'invalid' });
      }).toThrow('Position must be an instance of Vector2D');
    });
  });

  describe('update', () => {
    test('should update particle position based on velocity', () => {
      const deltaTime = 16; // Simulate 16ms frame time
      const expectedPosition = mockPosition.add(mockVelocity.multiply(deltaTime / 1000));
      
      particle.update(deltaTime);
      
      expect(particle.position).toEqual(expectedPosition);
    });

    test('should decrease lifetime and alpha over time', () => {
      const deltaTime = 500; // Half lifetime
      const initialAlpha = particle.alpha;
      
      particle.update(deltaTime);
      
      expect(particle.lifetime).toBe(500);
      expect(particle.alpha).toBeLessThan(initialAlpha);
    });

    test('should mark particle as dead when lifetime expires', () => {
      const deltaTime = 1001; // Slightly more than lifetime
      
      particle.update(deltaTime);
      
      expect(particle.isAlive).toBe(false);
    });

    test('should handle negative deltaTime gracefully', () => {
      expect(() => {
        particle.update(-16);
      }).not.toThrow();
    });
  });

  describe('render', () => {
    let mockContext;
    
    beforeEach(() => {
      mockContext = {
        save: jest.fn(),
        restore: jest.fn(),
        beginPath: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        globalAlpha: 1
      };
    });

    test('should render particle correctly', () => {
      particle.render(mockContext);
      
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.arc).toHaveBeenCalledWith(
        particle.position.x,
        particle.position.y,
        particle.size,
        0,
        Math.PI * 2
      );
      expect(mockContext.fill).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
    });

    test('should not render if particle is dead', () => {
      particle.isAlive = false;
      particle.render(mockContext);
      
      expect(mockContext.save).not.toHaveBeenCalled();
    });

    test('should throw error for invalid context', () => {
      expect(() => {
        particle.render(null);
      }).toThrow('Invalid rendering context');
    });
  });

  describe('reset', () => {
    test('should reset particle to initial state', () => {
      particle.update(500); // Update particle state
      particle.reset({
        position: new Vector2D(0, 0),
        velocity: new Vector2D(1, 1)
      });
      
      expect(particle.position).toEqual(new Vector2D(0, 0));
      expect(particle.velocity).toEqual(new Vector2D(1, 1));
      expect(particle.isAlive).toBe(true);
      expect(particle.alpha).toBe(1);
    });

    test('should maintain default values when not specified in reset', () => {
      const originalColor = particle.color;
      const originalSize = particle.size;
      
      particle.reset({});
      
      expect(particle.color).toBe(originalColor);
      expect(particle.size).toBe(originalSize);
    });
  });

  describe('performance', () => {
    test('should handle rapid updates efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        particle.update(16);
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});