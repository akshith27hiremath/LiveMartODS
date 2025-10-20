import winston from 'winston';

/**
 * Winston Logger Configuration
 * Provides structured logging for the application
 */

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0 && meta.stack) {
      metaString = `\n${meta.stack}`;
    } else if (Object.keys(meta).length > 0) {
      metaString = ` ${JSON.stringify(meta)}`;
    }
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  })
);

// Create transports
const transports: winston.transport[] = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: nodeEnv === 'development' ? consoleFormat : logFormat,
  }),
];

// File transport for production
if (nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Stream for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;
