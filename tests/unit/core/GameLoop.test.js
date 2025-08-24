/**
 * @fileoverview Unit tests for the GameLoop class
 * @jest
 */

import { jest } from '@jest/globals';

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Import the GameLoop class (assuming it's in the core directory)
import { GameLoop } from '../../../src/core/GameLoop';

describe('GameLoop', () => {
    let gameLoop;
    let mockUpdate;
    let mockRender;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Create mock functions for update and render
        mockUpdate = jest.fn();
        mockRender = jest.fn();
        
        // Initialize GameLoop with mock functions
        gameLoop = new GameLoop({
            update: mockUpdate,
            render: mockRender
        });
    });

    afterEach(() => {
        // Ensure loop is stopped after each test
        gameLoop.stop();
    });

    describe('initialization', () => {
        test('should create instance with default values', () => {
            expect(gameLoop).toBeDefined();
            expect(gameLoop.isRunning).toBeFalsy();
            expect(gameLoop.fps).toBe(60);
            expect(gameLoop.frameTime).toBe(1000 / 60);
        });

        test('should accept custom FPS', () => {
            const customFpsLoop = new GameLoop({
                update: mockUpdate,
                render: mockRender,
                fps: 30
            });
            expect(customFpsLoop.fps).toBe(30);
            expect(customFpsLoop.frameTime).toBe(1000 / 30);
        });

        test('should throw error if update function is not provided', () => {
            expect(() => new GameLoop({ render: mockRender }))
                .toThrow('Update function must be provided');
        });

        test('should throw error if render function is not provided', () => {
            expect(() => new GameLoop({ update: mockUpdate }))
                .toThrow('Render function must be provided');
        });
    });

    describe('game loop control', () => {
        test('should start the game loop', () => {
            gameLoop.start();
            expect(gameLoop.isRunning).toBeTruthy();
            expect(requestAnimationFrame).toHaveBeenCalled();
        });

        test('should stop the game loop', () => {
            gameLoop.start();
            gameLoop.stop();
            expect(gameLoop.isRunning).toBeFalsy();
            expect(cancelAnimationFrame).toHaveBeenCalled();
        });

        test('should not start multiple loops', () => {
            gameLoop.start();
            const firstFrameId = gameLoop.frameId;
            gameLoop.start();
            expect(gameLoop.frameId).toBe(firstFrameId);
        });
    });

    describe('game loop execution', () => {
        test('should call update and render on each frame', async () => {
            gameLoop.start();
            
            // Wait for a few frames
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockRender).toHaveBeenCalled();
            
            // Verify update receives delta time
            expect(mockUpdate).toHaveBeenCalledWith(expect.any(Number));
        });

        test('should maintain target FPS', async () => {
            const targetFps = 30;
            gameLoop = new GameLoop({
                update: mockUpdate,
                render: mockRender,
                fps: targetFps
            });

            gameLoop.start();
            
            // Wait for multiple frames
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const calls = mockUpdate.mock.calls.length;
            const expectedCalls = Math.floor((100 / 1000) * targetFps);
            
            // Allow for small variations in timing
            expect(calls).toBeGreaterThanOrEqual(expectedCalls - 1);
            expect(calls).toBeLessThanOrEqual(expectedCalls + 1);
        });

        test('should handle errors in update function', async () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const errorUpdate = jest.fn(() => {
                throw new Error('Update error');
            });

            gameLoop = new GameLoop({
                update: errorUpdate,
                render: mockRender
            });

            gameLoop.start();
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(errorSpy).toHaveBeenCalled();
            expect(gameLoop.isRunning).toBeTruthy(); // Loop should continue running
            
            errorSpy.mockRestore();
        });

        test('should handle errors in render function', async () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            const errorRender = jest.fn(() => {
                throw new Error('Render error');
            });

            gameLoop = new GameLoop({
                update: mockUpdate,
                render: errorRender
            });

            gameLoop.start();
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(errorSpy).toHaveBeenCalled();
            expect(gameLoop.isRunning).toBeTruthy(); // Loop should continue running
            
            errorSpy.mockRestore();
        });
    });

    describe('performance monitoring', () => {
        test('should track frame time', async () => {
            gameLoop.start();
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(gameLoop.lastFrameTime).toBeDefined();
            expect(typeof gameLoop.lastFrameTime).toBe('number');
            expect(gameLoop.lastFrameTime).toBeGreaterThan(0);
        });

        test('should calculate correct delta time', async () => {
            let lastDelta = 0;
            mockUpdate.mockImplementation((delta) => {
                lastDelta = delta;
            });

            gameLoop.start();
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(lastDelta).toBeGreaterThan(0);
            expect(lastDelta).toBeLessThan(100); // Reasonable frame time
        });
    });
});