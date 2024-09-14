import winston, { format } from 'winston';

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]ZZ' }),
  format.printf(
    ({ timestamp, level, message }) => `[${timestamp}] [${level}] ${message}`,
  ),
);

const logger = winston.createLogger({
  format: logFormat,
});

if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      dirname: 'logs',
      filename: 'esbern-org-server.log',
    }),
  );
} else {
  logger.add(new winston.transports.Console());
}

export default logger;
