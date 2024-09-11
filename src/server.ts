import logger from './util/logger.js';
import app from './app.js';
import { initPool } from './util/database.js';

const port = Number(process.env.EXPRESS_LISTEN_PORT) || 3000;
const host = process.env.EXPRESS_LISTEN_HOST || 'localhost';

initPool();

app
  .listen(port, host, () => {
    logger.info(`[express] Started listening on ${host}:${port}`);
  })
  .on('error', (err: unknown) => {
    logger.error(err);
    process.exit(1);
  });
