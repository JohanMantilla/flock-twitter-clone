import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';

describe('Likes (integration)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let likerToken: string;
    let likerUserId: string;
    let tweetId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
        );

        await app.init();
        dataSource = moduleFixture.get<DataSource>(DataSource);

        const suffix = Math.random().toString(36).substring(2, 8);

        await dataSource.query(`
            DELETE FROM likes
            WHERE user_id IN (
                SELECT id
                FROM "user"
                WHERE email LIKE '%@likes-test.com'
            )
        `);
        await dataSource.query(`
    DELETE FROM tweets
    WHERE user_id IN (
        SELECT id
        FROM "user"
        WHERE email LIKE '%@likes-test.com'
    )
`);
        await dataSource.query(`DELETE FROM "user" WHERE email LIKE '%@likes-test.com'`);

        const res = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: `liker-${suffix}@likes-test.com`,
                password: 'Password1',
                username: `likeruser${suffix}`,
            });

        expect(res.status).toBe(201);
        likerToken = res.body.token;
        likerUserId = res.body.user.id;

        const tweetRes = await request(app.getHttpServer())
            .post('/api/tweets')
            .set('Authorization', `Bearer ${likerToken}`)
            .send({ content: 'tweet to like' });

        expect(tweetRes.status).toBe(201);
        tweetId = tweetRes.body.id;
    });

    afterAll(async () => {
        await dataSource.query(`
    DELETE FROM likes
    WHERE user_id IN (
        SELECT id
        FROM "user"
        WHERE email LIKE '%@likes-test.com'
    )
`);
        await dataSource.query(`DELETE FROM tweets WHERE user_id = $1`, [likerUserId]);
        await dataSource.query(`DELETE FROM "user" WHERE email LIKE '%@likes-test.com'`);
        await app.close();
    });

    describe('POST /api/tweets/:id/like', () => {
        afterEach(async () => {
            await dataSource.query(
                `DELETE FROM likes WHERE user_id = $1`,
                [likerUserId],
            );

            await dataSource.query(
                `UPDATE tweets
         SET likes_count = 0
         WHERE id = $1`,
                [tweetId],
            );
        });

        it('201 returns { likesCount: 1 } on first like', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/tweets/${tweetId}/like`)
                .set('Authorization', `Bearer ${likerToken}`)
                .expect(201);

            expect(res.body).toEqual({ likesCount: 1 });
        });

        it('401 without token', async () => {
            await request(app.getHttpServer())
                .post(`/api/tweets/${tweetId}/like`)
                .expect(401);
        });

        it('404 if tweet does not exist', async () => {
            await request(app.getHttpServer())
                .post(`/api/tweets/00000000-0000-0000-0000-000000000000/like`)
                .set('Authorization', `Bearer ${likerToken}`)
                .expect(404);
        });

        it('400 if already liked', async () => {
            await request(app.getHttpServer())
                .post(`/api/tweets/${tweetId}/like`)
                .set('Authorization', `Bearer ${likerToken}`);

            await request(app.getHttpServer())
                .post(`/api/tweets/${tweetId}/like`)
                .set('Authorization', `Bearer ${likerToken}`)
                .expect(400);
        });

        it('likesCount is 1 in DB after like', async () => {
            await request(app.getHttpServer())
                .post(`/api/tweets/${tweetId}/like`)
                .set('Authorization', `Bearer ${likerToken}`)
                .expect(201);

            const rows = await dataSource.query(
                `SELECT likes_count FROM tweets WHERE id = $1`,
                [tweetId],
            );

            expect(rows[0].likes_count).toBe(1);
        });
    });

    describe('DELETE /api/tweets/:id/like', () => {
        beforeEach(async () => {
            await dataSource.query(`
    DELETE FROM likes
    WHERE user_id IN (
        SELECT id
        FROM "user"
        WHERE email LIKE '%@likes-test.com'
    )
`);
            await dataSource.query(
                `UPDATE tweets SET likes_count = 0 WHERE id = $1`,
                [tweetId],
            );

            await request(app.getHttpServer())
                .post(`/api/tweets/${tweetId}/like`)
                .set('Authorization', `Bearer ${likerToken}`);
        });

        it('200 returns { likesCount: 0 } after unlike', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/api/tweets/${tweetId}/like`)
                .set('Authorization', `Bearer ${likerToken}`)
                .expect(200);

            expect(res.body).toEqual({ likesCount: 0 });
        });

        it('401 without token', async () => {
            await request(app.getHttpServer())
                .delete(`/api/tweets/${tweetId}/like`)
                .expect(401);
        });

        it('404 if tweet does not exist', async () => {
            await request(app.getHttpServer())
                .delete(`/api/tweets/00000000-0000-0000-0000-000000000000/like`)
                .set('Authorization', `Bearer ${likerToken}`)
                .expect(404);
        });

        it('400 if not liked', async () => {
            await dataSource.query(`
    DELETE FROM likes
    WHERE user_id IN (
        SELECT id
        FROM "user"
        WHERE email LIKE '%@likes-test.com'
    )
`);
            await dataSource.query(
                `UPDATE tweets SET likes_count = 0 WHERE id = $1`,
                [tweetId],
            );

            await request(app.getHttpServer())
                .delete(`/api/tweets/${tweetId}/like`)
                .set('Authorization', `Bearer ${likerToken}`)
                .expect(400);
        });

        it('likesCount is 0 in DB after unlike', async () => {
            await request(app.getHttpServer())
                .delete(`/api/tweets/${tweetId}/like`)
                .set('Authorization', `Bearer ${likerToken}`)
                .expect(200);

            const rows = await dataSource.query(
                `SELECT likes_count FROM tweets WHERE id = $1`,
                [tweetId],
            );

            expect(rows[0].likes_count).toBe(0);
        });
    });
});