/**
 * @jest/unit/utils/ObjectPool.test.js
 * Unit tests for the ObjectPool utility class used in particle effects system
 * 
 * @jest
 */

import { ObjectPool } from '../../../src/utils/ObjectPool';

describe('ObjectPool', () => {
    // Test setup variables
    let pool;
    const defaultSize = 100;
    
    // Mock particle factory function
    const createParticle = () => ({
        x: 0,
        y: 0,
        active: false,
        reset: function() {
            this.x = 0;
            this.y = 0;
            this.active = false;
        }
    });

    beforeEach(() => {
        // Fresh pool instance before each test
        pool = new ObjectPool(createParticle, defaultSize);
    });

    afterEach(() => {
        // Cleanup after each test
        pool = null;
    });

    describe('Constructor', () => {
        test('should create pool with specified size', () => {
            expect(pool.size()).toBe(defaultSize);
        });

        test('should throw error when factory function is not provided', () => {
            expect(() => new ObjectPool(null, 10))
                .toThrow('Factory function must be provided');
        });

        test('should throw error when size is invalid', () => {
            expect(() => new ObjectPool(createParticle, -1))
                .toThrow('Pool size must be greater than 0');
        });
    });

    describe('acquire()', () => {
        test('should return inactive object from pool', () => {
            const obj = pool.acquire();
            expect(obj).toBeDefined();
            expect(obj.active).toBe(true);
        });

        test('should return different objects on multiple calls', () => {
            const obj1 = pool.acquire();
            const obj2 = pool.acquire();
            expect(obj1).not.toBe(obj2);
        });

        test('should expand pool when no inactive objects available', () => {
            const initialSize = pool.size();
            
            // Acquire all objects
            for (let i = 0; i < initialSize; i++) {
                pool.acquire();
            }

            // Acquire one more
            const extraObj = pool.acquire();
            expect(extraObj).toBeDefined();
            expect(pool.size()).toBeGreaterThan(initialSize);
        });

        test('should reset object state before returning', () => {
            const obj = pool.acquire();
            obj.x = 100;
            obj.y = 200;
            pool.release(obj);

            const reacquiredObj = pool.acquire();
            expect(reacquiredObj.x).toBe(0);
            expect(reacquiredObj.y).toBe(0);
        });
    });

    describe('release()', () => {
        test('should mark object as inactive', () => {
            const obj = pool.acquire();
            pool.release(obj);
            expect(obj.active).toBe(false);
        });

        test('should throw error when releasing null/undefined', () => {
            expect(() => pool.release(null))
                .toThrow('Cannot release null or undefined object');
            expect(() => pool.release(undefined))
                .toThrow('Cannot release null or undefined object');
        });

        test('should throw error when releasing non-pool object', () => {
            const fakeObj = { active: true };
            expect(() => pool.release(fakeObj))
                .toThrow('Object does not belong to this pool');
        });

        test('should allow object to be reacquired', () => {
            const obj = pool.acquire();
            pool.release(obj);
            const reacquiredObj = pool.acquire();
            expect(reacquiredObj).toBeDefined();
            expect(reacquiredObj.active).toBe(true);
        });
    });

    describe('clear()', () => {
        test('should reset pool to initial size', () => {
            // Acquire objects to trigger expansion
            for (let i = 0; i < defaultSize + 10; i++) {
                pool.acquire();
            }

            pool.clear();
            expect(pool.size()).toBe(defaultSize);
        });

        test('should make all objects inactive', () => {
            // Acquire some objects
            const obj1 = pool.acquire();
            const obj2 = pool.acquire();

            pool.clear();
            expect(obj1.active).toBe(false);
            expect(obj2.active).toBe(false);
        });
    });

    describe('Performance', () => {
        test('should handle rapid acquire/release cycles efficiently', () => {
            const iterations = 10000;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                const obj = pool.acquire();
                pool.release(obj);
            }

            const endTime = performance.now();
            const timePerOperation = (endTime - startTime) / iterations;

            // Assert reasonable performance (adjust threshold as needed)
            expect(timePerOperation).toBeLessThan(0.1); // 0.1ms per operation
        });
    });

    describe('Memory Management', () => {
        test('should not leak memory during expansion', () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // Trigger multiple expansions
            for (let i = 0; i < defaultSize * 3; i++) {
                pool.acquire();
            }

            pool.clear();
            
            // Force garbage collection if available (Node.js only)
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage().heapUsed;
            const memoryDiff = finalMemory - initialMemory;

            // Allow for some overhead, but ensure no significant leaks
            expect(memoryDiff).toBeLessThan(1024 * 1024); // 1MB threshold
        });
    });
});