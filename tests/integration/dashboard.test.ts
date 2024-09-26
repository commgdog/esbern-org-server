import { afterAll, describe, it, expect, afterEach } from 'vitest';
import supertest from 'supertest';
import { mockDatabase, mockSession, resetDatabase, timeout } from '../mock.js';
import app from '../../src/services/express.js';
import { execQuery, initPool } from '../../src/services/database.js';

const database = await mockDatabase('role');
initPool();

const { user } = await mockSession();

afterAll(async () => {
  await resetDatabase(database);
});

afterEach(async () => {
  await timeout(250);
  await execQuery('DELETE FROM requests WHERE 1');
});

describe('GET /dashboard/total-request-count', () => {
  it('should return 200 if the total request count was read', async () => {
    await supertest(app)
      .get(`/dashboard/total-request-count`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual({
          count: 0,
        });
      });
  });
});

describe('GET /dashboard/total-request-duration', () => {
  it('should return 200 if the total request duration was read', async () => {
    await supertest(app)
      .get(`/dashboard/total-request-duration`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual({
          count: 0,
        });
      });
  });
});

describe('GET /dashboard/total-session-count', () => {
  it('should return 200 if the total session count was read', async () => {
    await supertest(app)
      .get(`/dashboard/total-session-count`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual({
          count: 0,
        });
      });
  });
});
