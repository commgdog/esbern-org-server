import { afterAll, afterEach, describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { mockDatabase, mockSession, resetDatabase } from '../mock.js';
import app from '../../src/util/express.js';
import { execQuery, initPool } from '../../src/util/database.js';
import Permission from '../../src/util/permission.js';

const database = await mockDatabase('role');
initPool();
const { role, user } = await mockSession();

afterAll(async () => {
  await resetDatabase(database);
});

afterEach(async () => {
  await execQuery('DELETE FROM roles WHERE roleId <> ?', [role.roleId]);
});

const timeout = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

describe('GET /audit', () => {
  it('should return 200 if the audits were read', async () => {
    const created = await supertest(app)
      .post('/role')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        name: 'name',
        description: 'description',
        permissions: [],
      });
    await supertest(app)
      .patch(`/role/${created.body.roleId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        name: 'name 1',
        description: 'description 1',
        permissions: [Permission.ROLE_READ],
      });
    await supertest(app)
      .patch(`/role/${created.body.roleId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        name: 'name 2',
        description: 'description 2',
        permissions: [Permission.ROLE_READ, Permission.ROLE_DELETE],
      });
    await timeout(1000);
    await supertest(app)
      .get(`/audit/Role/${created.body.roleId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body.length).toEqual(3);
      });
  });
});
