import { afterAll, afterEach, describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { mockDatabase, mockSession, resetDatabase, timeout } from '../mock.js';
import app from '../../src/services/express.js';
import { execQuery, initPool } from '../../src/services/database.js';
import { Permission } from '../../src/apis/role/RoleModel.js';

const database = await mockDatabase('role');
initPool();

const { role, user } = await mockSession();

afterAll(async () => {
  await resetDatabase(database);
});

afterEach(async () => {
  await execQuery('DELETE FROM roles WHERE roleId <> ?', [role.roleId]);
});

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
        permissions: [
          Permission.ROLE_READ,
          Permission.ROLE_DELETE,
          Permission.SETTINGS_READ,
        ],
      });
    await timeout(1000);
    await supertest(app)
      .get(`/audit`)
      .query({
        modelType: 'Role',
        modelId: created.body.roleId,
        offset: 0,
      })
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body.length).toEqual(3);
      });
  });
});
