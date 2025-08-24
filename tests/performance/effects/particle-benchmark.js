/**
 * @fileoverview Performance benchmarks for the Particle Effects System
 * Tests various particle configurations and measures rendering performance.
 * 
 * @author AI Senior Engineer
 * @version 1.0.0
 */

// Performance measurement utilities
const { performance, PerformanceObserver } = require('perf_hooks');

// Constants for particle system configuration
const BENCHMARK_CONFIGS = {
  SMALL: { particleCount: 100, iterations: 1000 },
  MEDIUM: { particleCount: 1000, iterations: 500 },
  LARGE: { particleCount: 10000, iterations: 100 }
};

// Mock particle for testing (would be replaced with actual Particle class in production)
class Particle {
  constructor(x, y, velocity, lifetime) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
    this.lifetime = lifetime;
    this.age = 0;
  }

  update(deltaTime) {
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    this.age += deltaTime;
    return this.age < this.lifetime;
  }
}

/**
 * Particle System performance test suite
 */
class ParticleSystemBenchmark {
  constructor() {
    this.results = new Map();
    this.setupPerformanceObserver();
  }

  /**
   * Sets up performance measurement observer
   * @private
   */
  setupPerformanceObserver() {
    const obs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.results.set(entry.name, entry.duration);
      });
    });
    obs.observe({ entryTypes: ['measure'], buffered: true });
  }

  /**
   * Creates a batch of particles for testing
   * @param {number} count - Number of particles to create
   * @returns {Array<Particle>} Array of particle instances
   * @private
   */
  createParticleBatch(count) {
    try {
      return Array.from({ length: count }, () => new Particle(
        Math.random() * 1000, // x
        Math.random() * 1000, // y
        { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 }, // velocity
        Math.random() * 1000 + 1000 // lifetime
      ));
    } catch (error) {
      console.error('Error creating particle batch:', error);
      throw new Error('Failed to create particle batch');
    }
  }

  /**
   * Runs a single benchmark iteration
   * @param {Array<Particle>} particles - Array of particles to update
   * @param {number} deltaTime - Time step for simulation
   * @private
   */
  runIteration(particles, deltaTime) {
    try {
      particles.forEach(particle => particle.update(deltaTime));
    } catch (error) {
      console.error('Error in particle update iteration:', error);
      throw new Error('Failed to run iteration');
    }
  }

  /**
   * Executes benchmark for given configuration
   * @param {string} configName - Name of benchmark configuration
   * @param {Object} config - Benchmark configuration parameters
   * @returns {Promise<Object>} Benchmark results
   */
  async runBenchmark(configName, config) {
    const { particleCount, iterations } = config;
    const markName = `benchmark_${configName}`;
    
    try {
      performance.mark(`${markName}_start`);
      
      const particles = this.createParticleBatch(particleCount);
      const deltaTime = 1/60; // Simulate 60 FPS

      for (let i = 0; i < iterations; i++) {
        this.runIteration(particles, deltaTime);
      }

      performance.mark(`${markName}_end`);
      performance.measure(markName, `${markName}_start`, `${markName}_end`);

      return {
        configName,
        particleCount,
        iterations,
        duration: this.results.get(markName),
        averageTimePerFrame: this.results.get(markName) / iterations
      };
    } catch (error) {
      console.error(`Benchmark failed for ${configName}:`, error);
      throw new Error(`Benchmark failed for ${configName}`);
    }
  }

  /**
   * Runs all benchmark configurations
   * @returns {Promise<Array<Object>>} Array of benchmark results
   */
  async runAllBenchmarks() {
    const results = [];
    
    try {
      for (const [configName, config] of Object.entries(BENCHMARK_CONFIGS)) {
        const result = await this.runBenchmark(configName, config);
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error('Failed to run all benchmarks:', error);
      throw new Error('Benchmark suite failed');
    }
  }
}

/**
 * Execute benchmarks and report results
 */
async function runBenchmarkSuite() {
  try {
    const benchmark = new ParticleSystemBenchmark();
    const results = await benchmark.runAllBenchmarks();
    
    console.table(results.map(result => ({
      'Configuration': result.configName,
      'Particle Count': result.particleCount,
      'Iterations': result.iterations,
      'Total Duration (ms)': result.duration.toFixed(2),
      'Avg Time/Frame (ms)': result.averageTimePerFrame.toFixed(4)
    })));
  } catch (error) {
    console.error('Benchmark suite failed:', error);
    process.exit(1);
  }
}

// Execute if running directly
if (require.main === module) {
  runBenchmarkSuite();
}

// Export for testing
module.exports = {
  ParticleSystemBenchmark,
  BENCHMARK_CONFIGS,
  Particle
};