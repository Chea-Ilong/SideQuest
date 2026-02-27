import 'dotenv/config';
import app from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

app.listen(config.port, () => {
  logger.info(
    { port: config.port, env: process.env['NODE_ENV'] ?? 'development' },
    'Skill DNA API server started'
  );
});
