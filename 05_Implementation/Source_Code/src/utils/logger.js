const { createLogger, format, transports } = require("winston");

/**
 * Configures Winston logger for application-wide logging
 * Logs to both console and file with timestamped messages
 */
const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(), // Adds timestamp to each log entry
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(), // Logs to console for real-time debugging
    new transports.File({ filename: "logs/combined.log" }), // Persists logs to file
  ],
});

module.exports = logger;
