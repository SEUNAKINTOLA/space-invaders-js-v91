/**
 * @fileoverview Object Pool implementation for efficient particle system management.
 * Reduces garbage collection overhead by reusing objects instead of creating/destroying them.
 * @module ObjectPool
 */

/**
 * @typedef {Object} PoolConfig
 * @property {Function} factory - Factory function to create new objects
 * @property {Function} [reset] - Function to reset object state (optional)
 * @property {number} [initialSize=100] - Initial pool size
 * @property {number} [maxSize=1000] - Maximum pool size
 * @property {boolean} [autoExpand=true] - Whether pool should automatically expand when empty
 */

/**
 * Manages a pool of reusable objects to minimize garbage collection and improve performance.
 */
class ObjectPool {
    /**
     * Creates a new ObjectPool instance.
     * @param {PoolConfig} config - Configuration options for the pool
     * @throws {Error} If required configuration is missing or invalid
     */
    constructor(config) {
        if (!config?.factory || typeof config.factory !== 'function') {
            throw new Error('ObjectPool requires a valid factory function');
        }

        this._factory = config.factory;
        this._reset = config.reset || ((obj) => obj);
        this._initialSize = Math.max(0, config.initialSize || 100);
        this._maxSize = Math.max(this._initialSize, config.maxSize || 1000);
        this._autoExpand = config.autoExpand !== false;

        /** @private */
        this._pool = [];
        /** @private */
        this._activeObjects = new Set();

        // Initialize pool with initial objects
        this._initializePool();
    }

    /**
     * Initializes the pool with the initial set of objects.
     * @private
     */
    _initializePool() {
        try {
            for (let i = 0; i < this._initialSize; i++) {
                this._pool.push(this._factory());
            }
        } catch (error) {
            throw new Error(`Failed to initialize object pool: ${error.message}`);
        }
    }

    /**
     * Acquires an object from the pool or creates a new one if necessary.
     * @returns {Object} An object from the pool
     * @throws {Error} If pool is empty and cannot expand
     */
    acquire() {
        let object;

        if (this._pool.length === 0) {
            if (!this._autoExpand || this.totalSize >= this._maxSize) {
                throw new Error('Object pool depleted and cannot expand');
            }
            object = this._factory();
        } else {
            object = this._pool.pop();
        }

        this._activeObjects.add(object);
        return object;
    }

    /**
     * Returns an object to the pool.
     * @param {Object} object - The object to return to the pool
     * @throws {Error} If the object wasn't acquired from this pool
     */
    release(object) {
        if (!this._activeObjects.has(object)) {
            throw new Error('Attempting to release an object not managed by this pool');
        }

        try {
            this._reset(object);
            this._activeObjects.delete(object);
            this._pool.push(object);
        } catch (error) {
            throw new Error(`Failed to release object: ${error.message}`);
        }
    }

    /**
     * Releases all active objects back to the pool.
     */
    releaseAll() {
        try {
            for (const object of this._activeObjects) {
                this.release(object);
            }
        } catch (error) {
            throw new Error(`Failed to release all objects: ${error.message}`);
        }
    }

    /**
     * Gets the number of available objects in the pool.
     * @returns {number} The number of available objects
     */
    get availableSize() {
        return this._pool.length;
    }

    /**
     * Gets the number of active objects currently in use.
     * @returns {number} The number of active objects
     */
    get activeSize() {
        return this._activeObjects.size;
    }

    /**
     * Gets the total number of objects managed by the pool.
     * @returns {number} The total number of objects
     */
    get totalSize() {
        return this.availableSize + this.activeSize;
    }

    /**
     * Clears the pool and releases all references.
     */
    dispose() {
        this._pool = [];
        this._activeObjects.clear();
    }
}

// Freeze the class to prevent modifications
Object.freeze(ObjectPool.prototype);
Object.freeze(ObjectPool);

export default ObjectPool;