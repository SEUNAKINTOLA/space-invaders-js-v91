/**
 * @fileoverview Integration tests for the Game System core functionality
 * including game loop and canvas rendering infrastructure.
 * @jest
 */

import { jest } from '@jest/globals';
import { GameSystem } from '../../../src/core/GameSystem';
import { CanvasRenderer } from '../../../src/rendering/CanvasRenderer';
import { GameLoop } from '../../../src/core/GameLoop';
import { TimeManager } from '../../../src/core/TimeManager';
import { GameState } from '../../../src/state/GameState';
import { TestUtils } from '../../utils/TestUtils';

describe('GameSystem Integration Tests', () => {
    /** @type {GameSystem} */
    let gameSystem;
    /** @type {HTMLCanvasElement} */
    let canvas;
    /** @type {CanvasRenderingContext2D} */
    let context;

    // Mock RAF for consistent testing
    const originalRAF = window.requestAnimationFrame;
    const originalCAF = window.cancelAnimationFrame;

    beforeAll(() => {
        // Setup RAF mock
        window.requestAnimationFrame = (callback) => setTimeout(callback, 16);
        window.cancelAnimationFrame = (id) => clearTimeout(id);
    });

    afterAll(() => {
        // Restore original RAF
        window.requestAnimationFrame = originalRAF;
        window.cancelAnimationFrame = originalCAF;
    });

    beforeEach(() => {
        // Setup canvas and context mocks
        canvas = document.createElement('canvas');
        context = canvas.getContext('2d');
        
        // Mock canvas methods
        context.clearRect = jest.fn();
        context.save = jest.fn();
        context.restore = jest.fn();

        gameSystem = new GameSystem({
            canvas,
            width: 800,
            height: 600
        });
    });

    afterEach(() => {
        gameSystem.destroy();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should properly initialize game system components', () => {
            expect(gameSystem.renderer).toBeInstanceOf(CanvasRenderer);
            expect(gameSystem.gameLoop).toBeInstanceOf(GameLoop);
            expect(gameSystem.timeManager).toBeInstanceOf(TimeManager);
            expect(gameSystem.gameState).toBeInstanceOf(GameState);
        });

        test('should throw error when initialized without canvas', () => {
            expect(() => new GameSystem({}))
                .toThrow('Canvas element is required for game system initialization');
        });
    });

    describe('Game Loop Integration', () => {
        test('should start and stop game loop correctly', async () => {
            const updateSpy = jest.spyOn(gameSystem, 'update');
            const renderSpy = jest.spyOn(gameSystem.renderer, 'render');

            gameSystem.start();
            
            // Wait for a few frames
            await TestUtils.wait(50);
            
            expect(updateSpy).toHaveBeenCalled();
            expect(renderSpy).toHaveBeenCalled();
            
            gameSystem.stop();
            
            const updateCallCount = updateSpy.mock.calls.length;
            await TestUtils.wait(50);
            
            // Verify loop has stopped
            expect(updateSpy.mock.calls.length).toBe(updateCallCount);
        });

        test('should maintain consistent frame timing', async () => {
            const timeStamps = [];
            const frameTimes = [];
            
            gameSystem.gameLoop.onTick = (deltaTime, timestamp) => {
                timeStamps.push(timestamp);
                frameTimes.push(deltaTime);
            };

            gameSystem.start();
            await TestUtils.wait(100);
            gameSystem.stop();

            // Check frame timing consistency
            const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
            expect(avgFrameTime).toBeCloseTo(16.67, 0); // Approximately 60 FPS
        });
    });

    describe('Rendering Integration', () => {
        test('should properly clear and render frame', () => {
            gameSystem.renderer.render();
            
            expect(context.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
            expect(context.save).toHaveBeenCalled();
            expect(context.restore).toHaveBeenCalled();
        });

        test('should handle canvas resize', () => {
            gameSystem.resize(1024, 768);
            
            expect(canvas.width).toBe(1024);
            expect(canvas.height).toBe(768);
            expect(gameSystem.renderer.width).toBe(1024);
            expect(gameSystem.renderer.height).toBe(768);
        });
    });

    describe('Error Handling', () => {
        test('should handle render errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            context.save.mockImplementation(() => {
                throw new Error('Render error');
            });

            expect(() => gameSystem.renderer.render()).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Render error occurred:')
            );
        });

        test('should handle game loop errors without crashing', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            gameSystem.update = () => {
                throw new Error('Update error');
            };

            gameSystem.start();
            await TestUtils.wait(50);
            
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Game loop error:')
            );
            
            // Game should continue running despite error
            expect(gameSystem.gameLoop.isRunning).toBe(true);
        });
    });

    describe('Performance', () => {
        test('should maintain performance within acceptable bounds', async () => {
            const performanceMetrics = [];
            
            gameSystem.gameLoop.onTick = (deltaTime) => {
                // Simulate some game logic
                for (let i = 0; i < 1000; i++) {
                    Math.random();
                }
                performanceMetrics.push(deltaTime);
            };

            gameSystem.start();
            await TestUtils.wait(500);
            gameSystem.stop();

            const maxFrameTime = Math.max(...performanceMetrics);
            expect(maxFrameTime).toBeLessThan(32); // No frame should take longer than 32ms
        });
    });
});