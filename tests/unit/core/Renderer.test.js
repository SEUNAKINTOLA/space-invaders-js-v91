/**
 * @fileoverview Unit tests for the Renderer class
 * @jest
 */

import { jest } from '@jest/globals';

describe('Renderer', () => {
    let Renderer;
    let mockCanvas;
    let mockContext;
    let renderer;

    // Mock requestAnimationFrame globally
    const originalRAF = global.requestAnimationFrame;
    const originalCAF = global.cancelAnimationFrame;

    beforeAll(() => {
        // Mock requestAnimationFrame and cancelAnimationFrame
        global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
        global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));
        
        // Dynamic import to ensure mocks are in place
        return import('../../../src/core/Renderer').then(module => {
            Renderer = module.default;
        });
    });

    beforeEach(() => {
        // Create mock canvas and context
        mockContext = {
            clearRect: jest.fn(),
            save: jest.fn(),
            restore: jest.fn(),
            scale: jest.fn(),
            translate: jest.fn(),
            drawImage: jest.fn(),
        };

        mockCanvas = {
            getContext: jest.fn(() => mockContext),
            width: 800,
            height: 600,
        };

        // Create fresh renderer instance for each test
        renderer = new Renderer(mockCanvas);
    });

    afterAll(() => {
        // Restore original window functions
        global.requestAnimationFrame = originalRAF;
        global.cancelAnimationFrame = originalCAF;
    });

    describe('initialization', () => {
        test('should properly initialize with canvas element', () => {
            expect(renderer.canvas).toBe(mockCanvas);
            expect(renderer.context).toBe(mockContext);
            expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
        });

        test('should throw error if canvas is not provided', () => {
            expect(() => new Renderer()).toThrow('Canvas element is required');
            expect(() => new Renderer(null)).toThrow('Canvas element is required');
        });

        test('should throw error if canvas context cannot be obtained', () => {
            mockCanvas.getContext.mockReturnValue(null);
            expect(() => new Renderer(mockCanvas)).toThrow('Failed to get 2D context');
        });
    });

    describe('render loop', () => {
        test('should start and stop render loop', () => {
            const mockRender = jest.fn();
            renderer.setRenderFunction(mockRender);

            renderer.start();
            expect(global.requestAnimationFrame).toHaveBeenCalled();

            renderer.stop();
            expect(global.cancelAnimationFrame).toHaveBeenCalled();
        });

        test('should not start multiple render loops', () => {
            renderer.start();
            const firstFrameId = renderer.frameId;
            renderer.start();
            expect(renderer.frameId).toBe(firstFrameId);
        });

        test('should handle render function errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
            const mockRender = jest.fn().mockImplementation(() => {
                throw new Error('Render error');
            });

            renderer.setRenderFunction(mockRender);
            renderer.start();

            // Wait for one frame
            return new Promise(resolve => setTimeout(resolve, 20)).then(() => {
                expect(consoleSpy).toHaveBeenCalled();
                consoleSpy.mockRestore();
            });
        });
    });

    describe('canvas operations', () => {
        test('should clear canvas correctly', () => {
            renderer.clear();
            expect(mockContext.clearRect).toHaveBeenCalledWith(
                0, 0, mockCanvas.width, mockCanvas.height
            );
        });

        test('should handle resize operations', () => {
            const newWidth = 1024;
            const newHeight = 768;
            renderer.resize(newWidth, newHeight);

            expect(mockCanvas.width).toBe(newWidth);
            expect(mockCanvas.height).toBe(newHeight);
        });

        test('should validate resize dimensions', () => {
            expect(() => renderer.resize(-100, 100)).toThrow('Invalid dimensions');
            expect(() => renderer.resize(100, -100)).toThrow('Invalid dimensions');
            expect(() => renderer.resize(0, 100)).toThrow('Invalid dimensions');
        });
    });

    describe('rendering context state', () => {
        test('should properly manage context state', () => {
            renderer.saveState();
            expect(mockContext.save).toHaveBeenCalled();

            renderer.restoreState();
            expect(mockContext.restore).toHaveBeenCalled();
        });

        test('should apply transformations correctly', () => {
            renderer.setScale(2, 2);
            expect(mockContext.scale).toHaveBeenCalledWith(2, 2);

            renderer.setTranslation(100, 100);
            expect(mockContext.translate).toHaveBeenCalledWith(100, 100);
        });
    });

    describe('error handling', () => {
        test('should handle context loss gracefully', () => {
            const mockWebGLContextLostEvent = new Event('webglcontextlost');
            mockCanvas.dispatchEvent(mockWebGLContextLostEvent);

            expect(renderer.isContextLost()).toBe(true);
            expect(() => renderer.render()).not.toThrow();
        });

        test('should handle invalid render functions', () => {
            expect(() => renderer.setRenderFunction('not a function'))
                .toThrow('Render function must be a function');
            expect(() => renderer.setRenderFunction(null))
                .toThrow('Render function must be a function');
        });
    });
});