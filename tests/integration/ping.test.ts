import { afterAll, describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { mockDatabase, resetDatabase } from '../mock.js';
import app from '../../src/services/express.js';
import { initPool } from '../../src/services/database.js';

const database = await mockDatabase('role');
initPool();

afterAll(async () => {
  await resetDatabase(database);
});

describe('GET /ping', () => {
  it('should return 200 always', async () => {
    await supertest(app)
      .get('/ping')
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual({
          message: 'pong',
        });
      });
  });
});
