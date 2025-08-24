/**
 * @fileoverview Unit tests for Canvas rendering system
 * @jest-environment jsdom
 */

import { Canvas } from '../../../src/core/Canvas';
import { CanvasError } from '../../../src/core/errors/CanvasError';

describe('Canvas', () => {
    let canvas;
    let mockContext;
    
    // Setup before each test
    beforeEach(() => {
        // Mock canvas and context
        mockContext = {
            clearRect: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            scale: jest.fn(),
            translate: jest.fn()
        };

        // Create a real canvas element
        canvas = document.createElement('canvas');
        canvas.getContext = jest.fn(() => mockContext);
        
        // Mock document methods
        document.createElement = jest.fn(() => canvas);
        document.body.appendChild = jest.fn();
    });

    // Cleanup after each test
    afterEach(() => {
        jest.clearAllMocks();
        if (canvas) {
            canvas.remove();
        }
    });

    describe('Initialization', () => {
        test('should create canvas with correct dimensions', () => {
            const width = 800;
            const height = 600;
            const gameCanvas = new Canvas({ width, height });

            expect(gameCanvas.width).toBe(width);
            expect(gameCanvas.height).toBe(height);
            expect(canvas.width).toBe(width);
            expect(canvas.height).toBe(height);
        });

        test('should throw error when dimensions are invalid', () => {
            expect(() => new Canvas({ width: -1, height: 600 }))
                .toThrow(CanvasError);
            expect(() => new Canvas({ width: 800, height: -1 }))
                .toThrow(CanvasError);
            expect(() => new Canvas({ width: 0, height: 0 }))
                .toThrow(CanvasError);
        });

        test('should get 2D context successfully', () => {
            const gameCanvas = new Canvas({ width: 800, height: 600 });
            expect(gameCanvas.context).toBeTruthy();
            expect(canvas.getContext).toHaveBeenCalledWith('2d');
        });
    });

    describe('Rendering Operations', () => {
        let gameCanvas;

        beforeEach(() => {
            gameCanvas = new Canvas({ width: 800, height: 600 });
        });

        test('should clear canvas correctly', () => {
            gameCanvas.clear();
            
            expect(mockContext.clearRect).toHaveBeenCalledWith(
                0, 0,
                gameCanvas.width,
                gameCanvas.height
            );
        });

        test('should handle resize operations', () => {
            const newWidth = 1024;
            const newHeight = 768;
            
            gameCanvas.resize(newWidth, newHeight);

            expect(gameCanvas.width).toBe(newWidth);
            expect(gameCanvas.height).toBe(newHeight);
            expect(canvas.width).toBe(newWidth);
            expect(canvas.height).toBe(newHeight);
        });

        test('should throw error on invalid resize dimensions', () => {
            expect(() => gameCanvas.resize(-1, 600))
                .toThrow(CanvasError);
            expect(() => gameCanvas.resize(800, -1))
                .toThrow(CanvasError);
        });
    });

    describe('Transform Operations', () => {
        let gameCanvas;

        beforeEach(() => {
            gameCanvas = new Canvas({ width: 800, height: 600 });
        });

        test('should save and restore context state correctly', () => {
            gameCanvas.saveState();
            gameCanvas.restoreState();

            expect(mockContext.save).toHaveBeenCalled();
            expect(mockContext.restore).toHaveBeenCalled();
        });

        test('should apply scale transformation correctly', () => {
            const scaleX = 2;
            const scaleY = 2;

            gameCanvas.scale(scaleX, scaleY);

            expect(mockContext.scale).toHaveBeenCalledWith(scaleX, scaleY);
        });

        test('should apply translation correctly', () => {
            const x = 100;
            const y = 100;

            gameCanvas.translate(x, y);

            expect(mockContext.translate).toHaveBeenCalledWith(x, y);
        });
    });

    describe('Performance', () => {
        test('should handle rapid resize operations without memory leaks', () => {
            const gameCanvas = new Canvas({ width: 800, height: 600 });
            const iterations = 1000;
            
            const resizeOperation = () => {
                for (let i = 0; i < iterations; i++) {
                    gameCanvas.resize(800 + i, 600 + i);
                }
            };

            // Should not throw or crash
            expect(resizeOperation).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        test('should handle context acquisition failure', () => {
            canvas.getContext = jest.fn(() => null);

            expect(() => new Canvas({ width: 800, height: 600 }))
                .toThrow(CanvasError);
        });

        test('should handle canvas element creation failure', () => {
            document.createElement = jest.fn(() => null);

            expect(() => new Canvas({ width: 800, height: 600 }))
                .toThrow(CanvasError);
        });
    });
});