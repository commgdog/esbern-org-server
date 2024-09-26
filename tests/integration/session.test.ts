import { afterAll, afterEach, describe, it, expect } from 'vitest';
import supertest from 'supertest';
import dayjs from 'dayjs';
import { uuidv7 } from 'uuidv7';
import { mockAnnouncement, mockDatabase, mockUser, resetDatabase } from '../mock.js';
import { execQuery, initPool } from '../../src/services/database.js';
import app from '../../src/services/express.js';
import {
  MAX_LOGIN_ATTEMPTS,
  PASSWORD_MIN_LENGTH,
} from '../../src/apis/user/UserModel.js';
import Session, {
  generateExpiration,
} from '../../src/apis/session/SessionModel.js';

const database = await mockDatabase('session');
initPool();

afterAll(async () => {
  await resetDatabase(database);
});

afterEach(async () => {
  await execQuery('DELETE FROM users WHERE 1');
});

describe('POST /session', () => {
  it('should return 401 when no credentials are given', async () => {
    await supertest(app)
      .post('/session')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({
          message: 'Invalid username or password',
          errors: ['username', 'password'],
        });
      });
  });

  it('should return 429 when the user has too many login attempts', async () => {
    const user = mockUser();
    user.loginAttemptCount = MAX_LOGIN_ATTEMPTS;
    user.lastLoginAttemptAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
    await user.create();

    await supertest(app)
      .post('/session')
      .send({
        username: user.username,
        password: 'password',
      })
      .expect(429)
      .then((response) => {
        expect(response.body).toEqual({
          message: 'Account locked, try back later',
        });
      });
  });

  it('should return 401 when an invalid password is given', async () => {
    const user = mockUser();
    await user.create();

    await supertest(app)
      .post('/session')
      .send({
        username: user.username,
        password: 'bad password',
      })
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({
          message: 'Invalid username or password',
          errors: ['username', 'password'],
        });
      });
  });

  it('should return 202 when the user password is expired', async () => {
    const user = mockUser();
    user.passwordIsExpired = true;
    await user.create();

    await supertest(app)
      .post('/session')
      .send({
        username: user.username,
        password: 'password',
      })
      .expect(202)
      .then((response) => {
        expect(response.body).toEqual({
          message: 'Password is expired',
        });
      });
  });

  it('should return 400 when the user password is expired and the new password is too short', async () => {
    const user = mockUser();
    user.passwordIsExpired = true;
    await user.create();

    await supertest(app)
      .post('/session')
      .send({
        username: user.username,
        password: 'password',
        newPassword1: 'a',
        newPassword2: 'a',
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual({
          message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
          errors: ['newPassword'],
        });
      });
  });

  it('should return 400 when the user password is expired and the new passwords dont match', async () => {
    const user = mockUser();
    user.passwordIsExpired = true;
    await user.create();

    await supertest(app)
      .post('/session')
      .send({
        username: user.username,
        password: 'password',
        newPassword1: 'password1',
        newPassword2: 'password2',
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual({
          message: `Passwords do not match`,
          errors: ['newPassword'],
        });
      });
  });

  it('should return 200 when the user password is expired and a new password is set', async () => {
    const user = mockUser();
    user.passwordIsExpired = true;
    await user.create();

    await supertest(app)
      .post('/session')
      .send({
        username: user.username,
        password: 'password',
        newPassword1: 'newPassword',
        newPassword2: 'newPassword',
      })
      .expect(200)
      .then(async (response) => {
        const session = new Session({
          lastToken: response.body.lastToken,
        });
        await session.read(false);
        expect(response.body).toEqual(session.forClient());
      });
  });

  it('should return 200 on successful login', async () => {
    const user = mockUser();
    await user.create();

    await supertest(app)
      .post('/session')
      .send({
        username: user.username,
        password: 'password',
      })
      .expect(200)
      .then(async (response) => {
        const session = new Session({
          lastToken: response.body.lastToken,
        });
        await session.read(false);
        expect(response.body).toEqual(session.forClient());
      });
  });
});

describe('GET /session', () => {
  it('should return 200 and an empty session if not logged in', async () => {
    await supertest(app)
      .get('/session')
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(new Session().forClient());
      });
  });

  it('should return 200 a valid session if logged in', async () => {
    const user = mockUser();
    user.lastToken = uuidv7();
    user.tokenExpires = generateExpiration();
    await user.create();

    await supertest(app)
      .get('/session')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then(async (response) => {
        const session = new Session({
          lastToken: user.lastToken,
        });
        await session.read(false);
        expect(response.body).toEqual(session.forClient());
      });
  });
});

describe('DELETE /session', () => {
  it('should return 200 and an empty session if not logged in', async () => {
    await supertest(app)
      .delete('/session')
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(new Session().forClient());
      });
  });

  it('should return 200 and an empty session if logged in', async () => {
    const user = mockUser();
    user.lastToken = uuidv7();
    user.tokenExpires = generateExpiration();
    await user.create();

    await supertest(app)
      .delete('/session')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then(async (response) => {
        expect(response.body).toEqual(new Session().forClient());
      });
  });
});

describe('POST /session/mark-announcement-read', () => {
  it('should return 200 if the announcement was marked as ready', async () => {
    const user = mockUser();
    user.lastToken = uuidv7();
    user.tokenExpires = generateExpiration();
    await user.create();

    const announcement = mockAnnouncement();
    await announcement.create();

    await supertest(app)
      .post('/session/mark-announcement-read')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        announcementId: announcement.announcementId,
      })
      .expect(200)
      .then(async (response) => {
        const session = new Session({
          lastToken: user.lastToken,
        });
        await session.read(false);

        expect(response.body).toEqual(session.forClient());
      });
  });
});

describe('POST /session/change-theme', () => {
  it('should return 400 if an invalid theme is given', async () => {
    const user = mockUser();
    user.lastToken = uuidv7();
    user.tokenExpires = generateExpiration();
    await user.create();

    await supertest(app)
      .post('/session/change-theme')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        theme: 'unknown',
      })
      .expect(400)
      .then(async (response) => {
        expect(response.body).toEqual({
          message: 'Invalid theme',
        });
      });
  });

  it('should return 200 if the theme was changed', async () => {
    const user = mockUser();
    user.lastToken = uuidv7();
    user.tokenExpires = generateExpiration();
    await user.create();

    await supertest(app)
      .post('/session/change-theme')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        theme: 'dark',
      })
      .expect(200)
      .then(async (response) => {
        expect(response.body).toEqual({
          message: 'Theme changed',
        });
      });
  });
});

describe('POST /session/change-password', () => {
  it ('should return 400 if there are password errors', async () => {
    const user = mockUser();
    user.lastToken = uuidv7();
    user.tokenExpires = generateExpiration();
    await user.create();

    await supertest(app)
      .post('/session/change-password')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        currentPassword: 'password',
        password: '',
        passwordConfirm: '',
      })
      .expect(400)
      .then(async (response) => {
        expect(response.body).toEqual({
          message: 'Password must be at least 5 characters',
          errorFields: ['password'],
        });
      });
  });

  it ('should return 200 if the password was changed', async () => {
    const user = mockUser();
    user.lastToken = uuidv7();
    user.tokenExpires = generateExpiration();
    await user.create();

    await supertest(app)
      .post('/session/change-password')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        currentPassword: 'password',
        password: 'newPassword',
        passwordConfirm: 'newPassword',
      })
      .expect(200)
      .then(async (response) => {
        expect(response.body).toEqual({
          message: 'Password changed successfully',
        });
      });
  });
});
