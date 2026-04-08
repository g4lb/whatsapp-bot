const winston = require('winston');
const { DEFAULT_LOG_LEVEL } = require('./constants');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

module.exports = logger;
