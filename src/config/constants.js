/**
 * @fileoverview Game Engine Constants
 * This module contains all core constants used throughout the game engine.
 * Constants are grouped by category and frozen to prevent modification.
 * 
 * @module src/config/constants
 * @version 1.0.0
 */

/**
 * @constant {Object} CANVAS
 * Canvas-related constants
 */
export const CANVAS = Object.freeze({
  /** @type {number} Default canvas width in pixels */
  DEFAULT_WIDTH: 800,
  /** @type {number} Default canvas height in pixels */
  DEFAULT_HEIGHT: 600,
  /** @type {string} Default canvas background color */
  DEFAULT_BACKGROUND: '#000000',
  /** @type {string} Default canvas context type */
  CONTEXT_TYPE: '2d',
  /** @type {Object} Default canvas styling */
  STYLES: Object.freeze({
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)'
  })
});

/**
 * @constant {Object} GAME_LOOP
 * Game loop timing and frame rate constants
 */
export const GAME_LOOP = Object.freeze({
  /** @type {number} Target frames per second */
  TARGET_FPS: 60,
  /** @type {number} Maximum frame delta time (ms) to prevent spiral of death */
  MAX_FRAME_TIME: 100,
  /** @type {number} Minimum frame delta time (ms) */
  MIN_FRAME_TIME: 0,
  /** @type {number} Frame time step in milliseconds (16.67ms @ 60fps) */
  FRAME_TIME: 1000 / 60,
  /** @type {number} Maximum updates per frame to prevent hanging */
  MAX_UPDATES_PER_FRAME: 5
});

/**
 * @constant {Object} RENDER
 * Rendering-related constants
 */
export const RENDER = Object.freeze({
  /** @type {Object} Default render quality settings */
  QUALITY: Object.freeze({
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  }),
  /** @type {Object} Sprite rendering modes */
  SPRITE_MODE: Object.freeze({
    NORMAL: 'normal',
    ADDITIVE: 'additive',
    MULTIPLY: 'multiply'
  }),
  /** @type {Object} Text alignment options */
  TEXT_ALIGN: Object.freeze({
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right'
  })
});

/**
 * @constant {Object} DEBUG
 * Debugging and development constants
 */
export const DEBUG = Object.freeze({
  /** @type {boolean} Enable debug mode in development */
  ENABLED: process.env.NODE_ENV === 'development',
  /** @type {Object} Debug levels */
  LEVELS: Object.freeze({
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4,
    ALL: 5
  }),
  /** @type {Object} Performance thresholds */
  PERFORMANCE: Object.freeze({
    FRAME_TIME_WARNING: 16.67, // Warning threshold for frame time (ms)
    MEMORY_WARNING: 100 * 1024 * 1024 // Warning threshold for memory usage (bytes)
  })
});

/**
 * @constant {Object} EVENTS
 * Game engine event constants
 */
export const EVENTS = Object.freeze({
  /** @type {Object} Core engine events */
  CORE: Object.freeze({
    INIT: 'engine:init',
    START: 'engine:start',
    STOP: 'engine:stop',
    PAUSE: 'engine:pause',
    RESUME: 'engine:resume',
    FRAME_START: 'engine:frame:start',
    FRAME_END: 'engine:frame:end',
    ERROR: 'engine:error'
  }),
  /** @type {Object} Resource loading events */
  RESOURCE: Object.freeze({
    LOAD_START: 'resource:load:start',
    LOAD_PROGRESS: 'resource:load:progress',
    LOAD_COMPLETE: 'resource:load:complete',
    LOAD_ERROR: 'resource:load:error'
  })
});

/**
 * @constant {Object} ERRORS
 * Error message constants
 */
export const ERRORS = Object.freeze({
  CANVAS_CREATION: 'Failed to create canvas context',
  INVALID_FRAME_TIME: 'Invalid frame time detected',
  RESOURCE_LOAD: 'Failed to load game resource',
  INITIALIZATION: 'Game engine initialization failed'
});

/**
 * @constant {Object} DEFAULTS
 * Default configuration values
 */
export const DEFAULTS = Object.freeze({
  /** @type {Object} Default game configuration */
  GAME_CONFIG: Object.freeze({
    debug: DEBUG.ENABLED,
    quality: RENDER.QUALITY.HIGH,
    maxPlayers: 4,
    saveInterval: 30000 // Auto-save interval in ms
  }),
  /** @type {Object} Default audio settings */
  AUDIO: Object.freeze({
    enabled: true,
    volume: 1.0,
    musicVolume: 0.7,
    sfxVolume: 1.0
  })
});

// Validate constants integrity on import (development only)
if (process.env.NODE_ENV === 'development') {
  Object.keys(exports).forEach(key => {
    if (typeof exports[key] !== 'object') {
      console.warn(`Warning: Constant group ${key} is not an object`);
    }
    if (!Object.isFrozen(exports[key])) {
      console.warn(`Warning: Constant group ${key} is not frozen`);
    }
  });
}