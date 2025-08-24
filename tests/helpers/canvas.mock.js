/**
 * @fileoverview Canvas testing utilities and mock implementations
 * @module tests/helpers/canvas.mock
 * @description Provides mock implementations of HTML5 Canvas and related objects
 * for testing purposes. Implements common canvas methods with tracking capabilities
 * for test assertions.
 */

// Constants for default canvas configuration
const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

/**
 * @typedef {Object} CanvasOperation
 * @property {string} method - The name of the method called
 * @property {Array<any>} args - The arguments passed to the method
 * @property {number} timestamp - When the operation was performed
 */

/**
 * Creates a mock CanvasRenderingContext2D with tracking capabilities
 * @returns {Object} Mock context with method tracking
 */
class MockCanvasContext {
    constructor() {
        // Store operations for assertion purposes
        this.operations = [];
        
        // Track canvas state
        this.fillStyle = '#000000';
        this.strokeStyle = '#000000';
        this.lineWidth = 1;
        this.font = '10px sans-serif';
        this.textAlign = 'start';
        this.textBaseline = 'alphabetic';
        
        // State stack for save/restore operations
        this.stateStack = [];
    }

    /**
     * Records an operation for later assertion
     * @private
     * @param {string} method - Method name
     * @param {Array<any>} args - Method arguments
     */
    _recordOperation(method, args) {
        this.operations.push({
            method,
            args,
            timestamp: Date.now()
        });
    }

    /**
     * Clears all recorded operations
     * @public
     */
    clearOperations() {
        this.operations = [];
    }

    // Common Canvas API methods with tracking
    beginPath() {
        this._recordOperation('beginPath', []);
    }

    moveTo(x, y) {
        this._recordOperation('moveTo', [x, y]);
    }

    lineTo(x, y) {
        this._recordOperation('lineTo', [x, y]);
    }

    stroke() {
        this._recordOperation('stroke', []);
    }

    fill() {
        this._recordOperation('fill', []);
    }

    clearRect(x, y, width, height) {
        this._recordOperation('clearRect', [x, y, width, height]);
    }

    save() {
        this.stateStack.push({
            fillStyle: this.fillStyle,
            strokeStyle: this.strokeStyle,
            lineWidth: this.lineWidth,
            font: this.font,
            textAlign: this.textAlign,
            textBaseline: this.textBaseline
        });
        this._recordOperation('save', []);
    }

    restore() {
        if (this.stateStack.length > 0) {
            const state = this.stateStack.pop();
            Object.assign(this, state);
        }
        this._recordOperation('restore', []);
    }
}

/**
 * Creates a mock HTMLCanvasElement
 * @param {number} [width=DEFAULT_CANVAS_WIDTH] - Canvas width
 * @param {number} [height=DEFAULT_CANVAS_HEIGHT] - Canvas height
 * @returns {Object} Mock canvas element
 */
class MockCanvas {
    constructor(width = DEFAULT_CANVAS_WIDTH, height = DEFAULT_CANVAS_HEIGHT) {
        this.width = width;
        this.height = height;
        this.context = new MockCanvasContext();
    }

    /**
     * Mock implementation of getContext
     * @param {string} contextType - The context type (e.g., '2d')
     * @returns {MockCanvasContext|null} The mock context or null if type not supported
     * @throws {Error} If contextType is not supported
     */
    getContext(contextType) {
        try {
            if (contextType !== '2d') {
                throw new Error(`Context type '${contextType}' is not supported in mock canvas`);
            }
            return this.context;
        } catch (error) {
            console.error(`Error getting canvas context: ${error.message}`);
            return null;
        }
    }

    /**
     * Mock implementation of toDataURL
     * @param {string} [type='image/png'] - The image format
     * @returns {string} A mock data URL
     */
    toDataURL(type = 'image/png') {
        return `data:${type};base64,mock-canvas-data`;
    }
}

/**
 * Creates a fully mocked canvas environment for testing
 * @param {Object} [options] - Configuration options
 * @param {number} [options.width] - Canvas width
 * @param {number} [options.height] - Canvas height
 * @returns {Object} Mock canvas environment
 */
export function createMockCanvasEnvironment(options = {}) {
    const canvas = new MockCanvas(options.width, options.height);
    
    return {
        canvas,
        context: canvas.getContext('2d'),
        
        /**
         * Reset the mock canvas state
         */
        reset() {
            canvas.context.clearOperations();
            canvas.context.stateStack = [];
        }
    };
}

/**
 * Utility functions for canvas testing
 */
export const canvasTestUtils = {
    /**
     * Checks if a specific operation was performed on the canvas
     * @param {MockCanvasContext} context - The mock context
     * @param {string} methodName - The method to check for
     * @param {Array<any>} [args] - Expected arguments
     * @returns {boolean} Whether the operation was found
     */
    hasOperation(context, methodName, args) {
        return context.operations.some(op => {
            if (op.method !== methodName) return false;
            if (!args) return true;
            return JSON.stringify(op.args) === JSON.stringify(args);
        });
    },

    /**
     * Gets the count of specific operations performed
     * @param {MockCanvasContext} context - The mock context
     * @param {string} methodName - The method to count
     * @returns {number} Number of operations found
     */
    getOperationCount(context, methodName) {
        return context.operations.filter(op => op.method === methodName).length;
    }
};

export default {
    MockCanvas,
    MockCanvasContext,
    createMockCanvasEnvironment,
    canvasTestUtils
};