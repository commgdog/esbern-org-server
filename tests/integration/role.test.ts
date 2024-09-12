import { afterAll, afterEach, describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { mockDatabase, mockRole, mockSession, resetDatabase } from '../mock.js';
import app from '../../src/services/express.js';
import { execQuery, initPool } from '../../src/services/database.js';
import Role, { Permission } from '../../src/apis/role/RoleModel.js';

const database = await mockDatabase('role');
initPool();
const { role, user } = await mockSession();

afterAll(async () => {
  await resetDatabase(database);
});

afterEach(async () => {
  await execQuery('DELETE FROM roles WHERE roleId <> ?', [role.roleId]);
});

describe('POST /role', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .post('/role')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 400 if the schema is invalid', async () => {
    await supertest(app)
      .post('/role')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        description: 'description',
        permissions: [],
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual([
          {
            field: 'name',
            message: '"Name" is required',
          },
        ]);
      });
  });

  it('should return 400 if the name is already in use', async () => {
    await mockRole('INUSE').create();

    await supertest(app)
      .post('/role')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        name: 'INUSE',
        description: 'description',
        permissions: [],
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual([
          {
            field: 'name',
            message: '"Name" already in use',
          },
        ]);
      });
  });

  it('should return 200 if the role was created', async () => {
    await supertest(app)
      .post('/role')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        name: 'name',
        description: 'description',
        permissions: [],
      })
      .expect(200)
      .then(async (response) => {
        const saved = new Role({
          roleId: response.body.roleId,
        });
        await saved.read();
        expect(response.body).toEqual(saved.forClient());
      });
  });
});

describe('GET /role', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .post('/role')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 200 if the roles were read', async () => {
    const saved1 = mockRole();
    await saved1.create();
    const saved2 = mockRole();
    await saved2.create();

    await supertest(app)
      .get('/role')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then(async (response) => {
        expect(response.body.length).toEqual(3);
        expect(response.body).toContainEqual({
          roleId: role.roleId,
          name: role.name,
          description: role.description,
        });
        expect(response.body).toContainEqual({
          roleId: saved1.roleId,
          name: saved1.name,
          description: saved1.description,
        });
        expect(response.body).toContainEqual({
          roleId: saved2.roleId,
          name: saved2.name,
          description: saved2.description,
        });
      });
  });
});

describe('GET /role/:roleId', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .get('/role/any')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 404 if not found', async () => {
    await supertest(app)
      .get('/role/badId')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Role not found' });
      });
  });

  it('should return 200 if the role was read', async () => {
    const saved = mockRole();
    await saved.create();

    await supertest(app)
      .get(`/role/${saved.roleId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(saved.forClient());
      });
  });
});

describe('PATCH /role', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .patch('/role/any')
      .send({
        name: 'New',
        description: 'description',
      })
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 404 if not found', async () => {
    await supertest(app)
      .patch('/role/badId')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        name: 'New',
        description: 'description',
      })
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Role not found' });
      });
  });

  it('should return 400 if the request is missing data', async () => {
    const created = mockRole();
    await created.create();

    await supertest(app)
      .patch(`/role/${created.roleId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        name: 'New',
        description: 'description',
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual([
          {
            field: 'permissions',
            message: '"Permissions" is required',
          },
        ]);
      });
  });

  it('should return 200 if the role was updated', async () => {
    const created = mockRole();
    await created.create();

    await supertest(app)
      .patch(`/role/${created.roleId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        name: 'New',
        description: 'description',
        permissions: [Permission.ROLE_READ],
      })
      .expect(200)
      .then(async (response) => {
        await created.read();
        expect(response.body).toEqual(created.forClient());
      });
  });
});

describe('DELETE /role', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .delete('/role/any')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 404 if not found', async () => {
    await supertest(app)
      .delete('/role/badId')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Role not found' });
      });
  });

  it('should return 200 if the role was deleted', async () => {
    const created = mockRole();
    await created.create();

    await supertest(app)
      .delete(`/role/${created.roleId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Role deleted' });
      });
  });
});
