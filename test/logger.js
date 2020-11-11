const winston = require('winston');

const {
  format,
  transports
} = winston;

const logger = winston.createLogger({
  level: 'info',
  format: format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new transports.File({ filename: 'log/combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize({ colors: { info: 'blue' }}),
      format.simple()
    )
  }));
}

logger.info({
  message: 'Pass an object and this works',
});