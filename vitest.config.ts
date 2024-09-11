import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

const cwd = import.meta.dirname;

dotenv.config({ path: `${cwd}/.env.test` });

export default defineConfig({
  test: {
    setupFiles: ['./vitest.setup.ts'],
  },
});
