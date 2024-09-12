import logger from './services/logger.js';
import app from './services/express.js';
import { initPool } from './services/database.js';

const port = Number(process.env.EXPRESS_LISTEN_PORT) || 3000;
const host = process.env.EXPRESS_LISTEN_HOST || 'localhost';

initPool();

app
  .listen(port, host, () => {
    logger.info(`[express] Started listening on ${host}:${port}`);
  })
  .on('error', (err) => {
    logger.error(err);
    process.exit(1);
  });
