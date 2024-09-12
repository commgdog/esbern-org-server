import { afterAll, afterEach, describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { uuidv7 } from 'uuidv7';
import { mockDatabase, mockSession, mockUser, resetDatabase } from '../mock.js';
import app from '../../src/services/express.js';
import { execQuery, initPool } from '../../src/services/database.js';
import User from '../../src/apis/user/UserModel.js';

const database = await mockDatabase('user');
initPool();
const { user } = await mockSession();

afterAll(async () => {
  await resetDatabase(database);
});

afterEach(async () => {
  await execQuery('DELETE FROM users WHERE userId <> ?', [user.userId]);
});

describe('POST /user', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .post('/user')
      .send({
        username: 'Test',
      })
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 400 if the schema is invalid', async () => {
    await supertest(app)
      .post('/user')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        email: 'commgdog@gmail.com',
        password: 'password',
        passwordConfirm: 'password',
        passwordIsExpired: false,
        firstName: 'Grant',
        lastName: 'Martin',
        homePage: 'dashboard',
        isInactive: false,
        roles: [],
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual([
          {
            field: 'username',
            message: '"Username" is required',
          },
        ]);
      });
  });

  it('should return 400 if the username is already in use', async () => {
    const created = mockUser('INUSE');
    await created.create();

    await supertest(app)
      .post('/user')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        username: 'INUSE',
        email: 'commgdog@gmail.com',
        password: 'password',
        passwordConfirm: 'password',
        passwordIsExpired: false,
        firstName: 'Grant',
        lastName: 'Martin',
        homePage: 'dashboard',
        isInactive: false,
        roles: [],
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual([
          {
            field: 'username',
            message: '"Username" already in use',
          },
        ]);
      });
  });

  it('should return 200 if the user was created', async () => {
    await supertest(app)
      .post('/user')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        username: 'Test',
        email: 'commgdog@gmail.com',
        password: 'password',
        passwordConfirm: 'password',
        passwordIsExpired: false,
        firstName: 'Grant',
        lastName: 'Martin',
        homePage: 'dashboard',
        isInactive: false,
        roles: [],
      })
      .expect(200)
      .then(async (response) => {
        const saved = new User({
          userId: response.body.userId,
        });
        await saved.read();
        expect(response.body).toEqual(saved.forClient());
      });
  });
});

describe('GET /user', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .get('/user')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 200 if the users were read', async () => {
    const saved1 = mockUser();
    await saved1.create();
    const saved2 = mockUser();
    await saved2.create();
    await supertest(app)
      .get('/user')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body.length).toEqual(3);
        expect(response.body).toContainEqual({
          userId: user.userId,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          hasActiveSession: true,
          isInactive: user.isInactive,
        });
        expect(response.body).toContainEqual({
          userId: saved1.userId,
          username: saved1.username,
          email: saved1.email,
          firstName: saved1.firstName,
          lastName: saved1.lastName,
          hasActiveSession: false,
          isInactive: saved1.isInactive,
        });
        expect(response.body).toContainEqual({
          userId: saved2.userId,
          username: saved2.username,
          email: saved2.email,
          firstName: saved2.firstName,
          lastName: saved2.lastName,
          hasActiveSession: false,
          isInactive: saved2.isInactive,
        });
      });
  });
});

describe('GET /user/:userId', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .get('/user/any')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 200 if the user was read', async () => {
    const created = mockUser();
    await created.create();

    await supertest(app)
      .get(`/user/${created.userId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(created.forClient());
      });
  });
});

describe('PATCH /user/:userId', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .patch('/user/any')
      .send({
        username: 'New',
      })
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 404 if not found', async () => {
    await supertest(app)
      .patch('/user/badId')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        username: 'New',
      })
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual({ message: 'User not found' });
      });
  });

  it('should return 400 if trying to make your own account inactive', async () => {
    await supertest(app)
      .patch(`/user/${user.userId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        username: 'Test',
        email: 'commgdog@gmail.com',
        password: null,
        passwordConfirm: null,
        passwordIsExpired: false,
        lastName: 'Martin',
        homePage: 'dashboard',
        isInactive: true,
        roles: [],
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual({
          message: 'Cannot make your own account inactive',
        });
      });
  });

  it('should return 400 if the request is missing data', async () => {
    const created = mockUser();
    await created.create();

    await supertest(app)
      .patch(`/user/${created.userId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        username: 'Test',
        email: 'commgdog@gmail.com',
        password: null,
        passwordConfirm: null,
        passwordIsExpired: false,
        lastName: 'Grant',
        homePage: 'dashboard',
        isInactive: false,
        roles: [],
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual([
          {
            field: 'firstName',
            message: '"First Name" is required',
          },
        ]);
      });
  });

  it('should return 200 if the user was updated without a password change', async () => {
    const created = mockUser();
    await created.create();
    const oldPassword = created.password;

    await supertest(app)
      .patch(`/user/${created.userId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        username: 'New',
        email: created.email,
        password: null,
        passwordConfirm: null,
        passwordIsExpired: created.passwordIsExpired,
        firstName: created.firstName,
        lastName: created.lastName,
        homePage: created.homePage,
        isInactive: created.isInactive,
        roles: created.roles,
      })
      .expect(200)
      .then(async (response) => {
        await created.read();
        expect(response.body).toEqual(created.forClient());
        expect(oldPassword).toEqual(created.password);
      });
  });

  it('should return 200 if the user was updated with a password change', async () => {
    const created = mockUser();
    await created.create();
    const oldPassword = created.password;

    await supertest(app)
      .patch(`/user/${created.userId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        username: 'New',
        email: created.email,
        password: 'secret',
        passwordConfirm: 'secret',
        passwordIsExpired: created.passwordIsExpired,
        firstName: created.firstName,
        lastName: created.lastName,
        homePage: created.homePage,
        isInactive: created.isInactive,
        roles: created.roles,
      })
      .expect(200)
      .then(async (response) => {
        await created.read();
        expect(response.body).toEqual(created.forClient());
        expect(oldPassword).not.toEqual(created.password);
      });
  });

  it('should return 200 if the user was updated and set inactive', async () => {
    const created = mockUser();
    await created.create();

    await supertest(app)
      .patch(`/user/${created.userId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        username: created.username,
        email: created.email,
        password: null,
        passwordConfirm: null,
        passwordIsExpired: created.passwordIsExpired,
        firstName: created.firstName,
        lastName: created.lastName,
        homePage: created.homePage,
        isInactive: created.isInactive,
        roles: created.roles,
      })
      .expect(200)
      .then(async (response) => {
        await created.read();
        expect(response.body).toEqual(created.forClient());
      });
  });

  it('should return 200 but not set any roles if unknown roles are given', async () => {
    const created = mockUser();
    await created.create();

    await supertest(app)
      .patch(`/user/${created.userId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        username: created.username,
        email: created.email,
        password: null,
        passwordConfirm: null,
        passwordIsExpired: created.passwordIsExpired,
        firstName: created.firstName,
        lastName: created.lastName,
        homePage: created.homePage,
        isInactive: created.isInactive,
        roles: [uuidv7(), uuidv7()],
      })
      .expect(200)
      .then(async (response) => {
        await created.read();
        expect(response.body).toEqual(created.forClient());
        expect(response.body.roles).toEqual([]);
      });
  });
});

describe('DELETE /user/:userId', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .delete('/user/any')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 404 if not found', async () => {
    await supertest(app)
      .delete('/user/badId')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual({ message: 'User not found' });
      });
  });

  it('should return 400 if trying to delete your own account', async () => {
    await supertest(app)
      .delete(`/user/${user.userId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual({
          message: 'Cannot delete your own account',
        });
      });
  });

  it('should return 200 if the user was deleted', async () => {
    const created = mockUser();
    await created.create();

    await supertest(app)
      .delete(`/user/${created.userId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual({ message: 'User deleted' });
      });
  });
});
