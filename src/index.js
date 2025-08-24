/**
 * @fileoverview Main application entry point
 * @module src/index
 * @requires dotenv/config
 * @requires winston
 * @requires process
 */

import 'dotenv/config';
import winston from 'winston';
import process from 'process';

/**
 * @constant {Object} logger
 * @description Configured winston logger instance with structured logging
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'app-main' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

/**
 * @constant {Object} config
 * @description Application configuration with environment validation
 */
const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Add other configuration variables as needed
};

/**
 * Validates required environment variables
 * @throws {Error} If required environment variables are missing
 */
const validateEnvironment = () => {
  const requiredEnvVars = [
    'NODE_ENV'
    // Add other required environment variables
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }
};

/**
 * Initializes application components and starts the service
 * @async
 * @throws {Error} If initialization fails
 */
async function initialize() {
  try {
    // Validate environment
    validateEnvironment();

    logger.info('Starting application...', {
      nodeEnv: config.nodeEnv,
      port: config.port
    });

    // Setup process handlers
    setupProcessHandlers();

    // Initialize your application components here
    // await initializeDatabase();
    // await initializeCache();
    // await initializeServer();

    logger.info('Application started successfully');
  } catch (error) {
    logger.error('Failed to initialize application', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Sets up process event handlers for graceful shutdown
 */
function setupProcessHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason,
      promise
    });
    process.exit(1);
  });

  // Handle graceful shutdown
  const shutdownSignals = ['SIGTERM', 'SIGINT'];
  shutdownSignals.forEach((signal) => {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      try {
        // Implement your cleanup logic here
        // await closeDatabase();
        // await closeServer();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', {
          error: error.message,
          stack: error.stack
        });
        process.exit(1);
      }
    });
  });
}

// Start the application
initialize().catch((error) => {
  logger.error('Fatal error during initialization', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Export configuration and logger for use in other modules
export { config, logger };