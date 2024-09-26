import { afterAll, afterEach, describe, it, expect } from 'vitest';
import supertest from 'supertest';
import { mockAnnouncement, mockDatabase, mockSession, resetDatabase } from '../mock.js';
import app from '../../src/services/express.js';
import { execQuery, initPool } from '../../src/services/database.js';
import dayjs from 'dayjs';
import Announcement from '../../src/apis/announcement/AnnouncementModel.js';

const database = await mockDatabase('announcement');
initPool();
const { user } = await mockSession();

afterAll(async () => {
  await resetDatabase(database);
});

afterEach(async () => {
  await execQuery('DELETE FROM announcements WHERE 1');
});

const startDateTime = dayjs().format('YYYY-MM-DD 00:00:00');
const endDateTime = dayjs().format('YYYY-MM-DD 00:00:00');

describe('POST /announcement', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .post('/announcement')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 400 if the schema is invalid', async () => {
    await supertest(app)
      .post('/announcement')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        announceAt: startDateTime,
        expiresAt: endDateTime,
        title: 'title',
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual([
          {
            field: 'body',
            message: '"Body" is required',
          },
        ]);
      });
  });

  it('should return 200 if the announcement was created', async () => {
    await supertest(app)
      .post('/announcement')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        announceAt: startDateTime,
        expiresAt: endDateTime,
        title: 'title',
        body: 'body',
      })
      .expect(200)
      .then(async (response) => {
        const saved = new Announcement({
          announcementId: response.body.announcementId,
        });
        await saved.read();
        expect(response.body).toEqual(saved.forClient());
      });
  });
});

describe('GET /announcement', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .post('/announcement')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 200 if the announcements were read', async () => {
    const saved1 = mockAnnouncement();
    await saved1.create();
    const saved2 = mockAnnouncement();
    await saved2.create();

    await supertest(app)
      .get('/announcement')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then(async (response) => {
        expect(response.body.length).toEqual(2);
        expect(response.body).toContainEqual({
          announcementId: saved1.announcementId,
          announceAt: saved1.announceAt,
          expiresAt: saved1.expiresAt,
          title: saved1.title,
        });
        expect(response.body).toContainEqual({
          announcementId: saved2.announcementId,
          announceAt: saved2.announceAt,
          expiresAt: saved2.expiresAt,
          title: saved2.title,
        });
      });
  });
});

describe('GET /announcement/:announcementId', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .get('/announcement/any')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 404 if not found', async () => {
    await supertest(app)
      .get('/announcement/badId')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Announcement not found' });
      });
  });

  it('should return 200 if the announcement was read', async () => {
    const saved = mockAnnouncement();
    await saved.create();

    await supertest(app)
      .get(`/announcement/${saved.announcementId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(saved.forClient());
      });
  });
});

describe('PATCH /announcement', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .patch('/announcement/any')
      .send({
        announceAt: startDateTime,
        expiresAt: endDateTime,
        title: 'new title',
        body: 'new body',
      })
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 404 if not found', async () => {
    await supertest(app)
      .patch('/announcement/badId')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        announceAt: startDateTime,
        expiresAt: endDateTime,
        title: 'new title',
        body: 'new body',
      })
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Announcement not found' });
      });
  });

  it('should return 400 if the request is missing data', async () => {
    const created = mockAnnouncement();
    await created.create();

    await supertest(app)
      .patch(`/announcement/${created.announcementId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        announceAt: startDateTime,
        expiresAt: endDateTime,
        title: 'new title',
      })
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual([
          {
            field: 'body',
            message: '"Body" is required',
          },
        ]);
      });
  });

  it('should return 200 if the announcement was updated', async () => {
    const created = mockAnnouncement();
    await created.create();

    await supertest(app)
      .patch(`/announcement/${created.announcementId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .send({
        announceAt: startDateTime,
        expiresAt: endDateTime,
        title: 'new title',
        body: 'new body',
      })
      .expect(200)
      .then(async (response) => {
        await created.read();
        expect(response.body).toEqual(created.forClient());
      });
  });
});

describe('DELETE /announcement', () => {
  it('should return 401 if not authorized', async () => {
    await supertest(app)
      .delete('/announcement/any')
      .expect(401)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Unauthorized' });
      });
  });

  it('should return 404 if not found', async () => {
    await supertest(app)
      .delete('/announcement/badId')
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(404)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Announcement not found' });
      });
  });

  it('should return 200 if the announcement was deleted', async () => {
    const created = mockAnnouncement();
    await created.create();

    await supertest(app)
      .delete(`/announcement/${created.announcementId}`)
      .set('Authorization', `Bearer ${user.lastToken}`)
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual({ message: 'Announcement deleted' });
      });
  });
});
