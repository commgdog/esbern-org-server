import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mockDatabase } from '../mock.js';

describe('Session Functionality', async () => {
  const db = await mockDatabase('session');

  console.log(db);

  it('should 1===1', () => {
    assert.strictEqual(1, 1);
  });

  /*
  let role: Role;
  let user: User;

  beforeAll(async () => {
    ({ role, user } = await mockEnvironment());
  });

  afterAll(async () => {
    await role.delete();
    await user.delete();
  });

  afterEach(async () => {
    user.lastToken = null;
    user.tokenExpires = null;
    user.loginAttemptCount = 0;
    user.lastLoginAttemptAt = null;
    user.lifetimeLoginCount = 0;
    await user.update();
  });

  describe('POST /session', () => {
    test('should return 401 when no credentials are given', async () => {
      const res = await supertest(app).post('/session').send();
      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({
        message: 'Invalid credentials',
        errors: ['username', 'password'],
      });
    });

    test('should return 429 when the user has too many login attempts', async () => {
      onTestFinished(async () => {
        user.loginAttemptCount = 0;
        user.lastLoginAttemptAt = null;
        await user.update();
      });
      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i += 1) {
        await supertest(app).post('/session').send({
          username: user.username,
          password: 'BAD_PASSWORD',
        });
      }
      const res = await supertest(app).post('/session').send({
        username: user.username,
        password: 'password',
      });
      expect(res.statusCode).toEqual(429);
      expect(res.body).toEqual({
        message: 'Account locked, try back later',
      });
    });

    test('should return 401 when an invalid password is given', async () => {
      const res = await supertest(app).post('/session').send({
        username: user.username,
        password: 'BAD_PASSWORD',
      });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({
        message: 'Invalid credentials',
        errors: ['username', 'password'],
      });
    });

    test('should return 202 when the user password is expired', async () => {
      user.passwordIsExpired = true;
      await user.update();
      const res = await supertest(app).post('/session').send({
        username: user.username,
        password: 'password',
      });
      expect(res.statusCode).toEqual(202);
      expect(res.body).toEqual({
        message: 'Password is expired',
      });
    });

    test('should return 400 when the user password is expired and the new password is too short', async () => {
      user.passwordIsExpired = true;
      await user.update();
      const res = await supertest(app).post('/session').send({
        username: user.username,
        password: 'password',
        newPassword1: 'a',
        newPassword2: 'a',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        errors: ['newPassword'],
      });
    });

    test('should return 400 when the user password is expired and the new passwords dont match', async () => {
      user.passwordIsExpired = true;
      await user.update();
      const res = await supertest(app).post('/session').send({
        username: user.username,
        password: 'password',
        newPassword1: 'password1',
        newPassword2: 'password2',
      });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({
        message: 'Passwords do not match',
        errors: ['newPassword'],
      });
    });

    test('should return 200 when the user password is expired and a new password is set', async () => {
      onTestFinished(async () => {
        user.passwordIsExpired = false;
        user.setPassword('password');
        await user.update();
      });
      user.passwordIsExpired = true;
      await user.update();
      const oldPassword = user.password;
      const res = await supertest(app).post('/session').send({
        username: user.username,
        password: 'password',
        newPassword1: 'newPassword',
        newPassword2: 'newPassword',
      });
      await user.read();
      let saved: any = new Session({
        lastToken: res.body.lastToken,
      });
      await saved.read(false);
      saved = saved.forClient();
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        side: saved.side,
        lastToken: saved.lastToken,
        tokenExpires: saved.tokenExpires,
        userId: saved.userId,
        organizationId: saved.organizationId,
        organizationAlias: saved.organizationAlias,
        customerId: saved.customerId,
        customerAlias: saved.customerAlias,
        username: saved.username,
        locationId: saved.locationId,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        passwordIsExpired: saved.passwordIsExpired,
        homePage: saved.homePage,
        isOrganizationOwner: saved.isOrganizationOwner,
        announcements: saved.announcements,
        availableAceIntegrations: saved.availableAceIntegrations,
        availableEagleIntegrations: saved.availableEagleIntegrations,
        availableLocations: saved.availableLocations,
        availableUserLocations: saved.availableUserLocations,
        availableRoles: saved.availableRoles,
        availableTiers: saved.availableTiers,
        features: saved.features,
        permissions: saved.permissions,
      });
      expect(oldPassword === user.password).toEqual(false);
    });

    test('should return 200 on successful login', async () => {
      const res = await supertest(app).post('/session').send({
        username: user.username,
        password: 'password',
      });
      let saved: any = new Session({
        lastToken: res.body.lastToken,
      });
      await saved.read(false);
      saved = saved.forClient();
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        lastToken: saved.lastToken,
        tokenExpires: saved.tokenExpires,
        userId: saved.userId,
        username: saved.username,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        passwordIsExpired: saved.passwordIsExpired,
        homePage: saved.homePage,
        availableRoles: saved.availableRoles,
        permissions: saved.permissions,
      });
    });
  });

  describe('GET /session', () => {
    test('should return 200 and an empty session if not logged in', async () => {
      const res = await supertest(app).get('/session').send();
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        lastToken: null,
        tokenExpires: null,
        userId: null,
        username: null,
        email: null,
        firstName: null,
        lastName: null,
        passwordIsExpired: false,
        homePage: 'dashboard',
        availableRoles: [],
        permissions: [],
      });
    });

    test('should return 200 a valid session if logged in', async () => {
      const login = await supertest(app).post('/session').send({
        username: user.username,
        password: 'password',
      });
      const res = await supertest(app)
        .get('/session')
        .set('Authorization', `Bearer ${login.body.lastToken}`)
        .send();
      let saved: any = new Session({
        lastToken: res.body.lastToken,
      });
      await saved.read(false);
      saved = saved.forClient();
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        lastToken: saved.lastToken,
        tokenExpires: saved.tokenExpires,
        userId: saved.userId,
        username: saved.username,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        passwordIsExpired: saved.passwordIsExpired,
        homePage: saved.homePage,
        availableRoles: saved.availableRoles,
        permissions: saved.permissions,
      });
    });
  });

  describe('DELETE /session', () => {
    test('should return 200 and an empty session if not logged in', async () => {
      const res = await supertest(app).delete('/session').send();
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        lastToken: null,
        tokenExpires: null,
        userId: null,
        username: null,
        email: null,
        firstName: null,
        lastName: null,
        passwordIsExpired: false,
        homePage: 'dashboard',
        availableRoles: [],
        permissions: [],
      });
    });

    test('should return 200 and an empty session if logged in', async () => {
      const login = await supertest(app).post('/session').send({
        username: user.username,
        password: 'password',
      });
      const res = await supertest(app)
        .delete('/session')
        .set('Authorization', `Bearer ${login.body.lastToken}`)
        .send();
      let saved: any = new Session({
        lastToken: res.body.lastToken,
      });
      await saved.read(false);
      saved = saved.forClient();
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        side: null,
        lastToken: null,
        tokenExpires: null,
        userId: null,
        organizationId: null,
        organizationAlias: null,
        customerId: null,
        customerAlias: null,
        username: null,
        locationId: null,
        email: null,
        firstName: null,
        lastName: null,
        passwordIsExpired: false,
        homePage: 'dashboard',
        isOrganizationOwner: false,
        announcements: [],
        availableAceIntegrations: [],
        availableEagleIntegrations: [],
        availableLocations: [],
        availableUserLocations: [],
        availableRoles: [],
        availableTiers: [],
        permissions: [],
        features: [],
      });
      expect(saved.lastToken).toEqual(null);
      expect(saved.tokenExpires).toEqual(null);
    });
  });

  describe('POST /change-password', () => {
    let token: string;
    let sessionUser: User;
    let sessionRole: Role;

    beforeAll(async () => {
      ({ token, user: sessionUser, role: sessionRole } = await mockSession());
    });

    afterAll(async () => {
      await sessionUser.delete();
      await sessionRole.delete();
    });

    test('should return 401 if not authorized', async () => {
      const res = await supertest(app).post('/session/change-password').send();
      expect(res.statusCode).toEqual(401);
      expect(res.body).toEqual({ message: 'Unauthorized' });
    });

    test('should return 400 if missing password', async () => {
      const res = await supertest(app)
        .post('/session/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send();
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({
        message: 'Missing password',
        errorFields: ['currentPassword', 'password', 'passwordConfirm'],
      });
    });

    test('should return 400 if password is too short', async () => {
      const res = await supertest(app)
        .post('/session/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password',
          password: 'a',
          passwordConfirm: 'a',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        errorFields: ['password'],
      });
    });

    test('should return 400 if passwords do not match', async () => {
      const res = await supertest(app)
        .post('/session/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password',
          password: 'password1',
          passwordConfirm: 'password2',
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({
        message: 'Passwords do not match',
        errorFields: ['password', 'passwordConfirm'],
      });
    });

    test('should return 200 if password was changed', async () => {
      onTestFinished(async () => {
        sessionUser.setPassword('password');
        await sessionUser.update();
      });
      const res = await supertest(app)
        .post('/session/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password',
          password: 'secret',
          passwordConfirm: 'secret',
        });
      const saved: any = new User({
        userId: sessionUser.userId,
      });
      await saved.read(false);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: 'Password changed successfully' });
      expect(saved.verifyPassword('secret')).toEqual(true);
    });
  });
   */
});
