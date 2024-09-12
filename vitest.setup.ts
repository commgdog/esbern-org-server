import { vi } from 'vitest';
import logger from './src/services/logger.js';

// @ts-expect-error mock
vi.spyOn(logger, 'info').mockImplementation(() => undefined);
