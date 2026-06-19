import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';

describe('Tweets (integration)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userAToken: string;
    let userBToken: string;
    let userAId: string;
    let userBId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        app.setGlobalPrefix('api');

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();

        dataSource = moduleFixture.get<DataSource>(DataSource);
        const suffix = Math.random().toString(36).substring(2, 8);

        // limpiar solo usuarios de test de esta suite
        await dataSource.query(`DELETE FROM "user" WHERE email LIKE '%@tweets-test.com'`);

        const resA = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: `a-${suffix}@tweets-test.com`,
                password: 'Password123',
                username: `usera${suffix}`,
            });

        userAToken = resA.body.token;
        userAId = resA.body.user.id;

        const resB = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: `b-${suffix}@tweets-test.com`,
                password: 'Password123',
                username: `userb${suffix}`,
            });

        userBToken = resB.body.token;
        userBId = resB.body.user.id;
    });

    afterAll(async () => {
        // esperar un tick para que requests en vuelo terminen
        await new Promise(r => setTimeout(r, 500));

        // borrar en orden correcto respetando FK
        // likes que referencian tweets de usuarios de test
        await dataSource.query(`
        DELETE FROM likes
        WHERE tweet_id IN (
            SELECT id FROM tweets
            WHERE user_id IN (
                SELECT id FROM "user" WHERE email LIKE '%@tweets-test.com'
            )
        )
        OR user_id IN (
            SELECT id FROM "user" WHERE email LIKE '%@tweets-test.com'
        )
    `);
        await dataSource.query(`
        DELETE FROM follows
        WHERE follower_id IN (SELECT id FROM "user" WHERE email LIKE '%@tweets-test.com')
        OR following_id IN (SELECT id FROM "user" WHERE email LIKE '%@tweets-test.com')
    `);
        await dataSource.query(`
        DELETE FROM tweets
        WHERE user_id IN (
            SELECT id FROM "user" WHERE email LIKE '%@tweets-test.com'
        )
    `);
        await dataSource.query(`
        DELETE FROM "user" WHERE email LIKE '%@tweets-test.com'
    `);
        await app.close();
    });

    describe('POST /api/tweets', () => {
        it('201 with valid token and content returns tweet with user without password', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${userAToken}`)
                .send({ content: 'Hello integration' })
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).not.toHaveProperty('password');
            expect(res.body.likesCount).toBe(0);
        });

        it('401 without token', async () => {
            await request(app.getHttpServer())
                .post('/api/tweets')
                .send({ content: 'No token' })
                .expect(401);
        });

        it('400 if content empty or only spaces or too long', async () => {
            await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${userAToken}`)
                .send({ content: '' })
                .expect(400);

            await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${userAToken}`)
                .send({ content: '    ' })
                .expect(400);

            const long = 'a'.repeat(281);
            await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${userAToken}`)
                .send({ content: long })
                .expect(400);
        });
    });

    describe('DELETE /api/tweets/:id', () => {
        let tweetId: string;

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${userAToken}`)
                .send({ content: 'tweet to delete' });

            tweetId = res.body.id;
        });

        it('200 if user is author', async () => {
            await request(app.getHttpServer())
                .delete(`/api/tweets/${tweetId}`)
                .set('Authorization', `Bearer ${userAToken}`)
                .expect(200);
        });

        it('401 without token', async () => {
            await request(app.getHttpServer())
                .delete(`/api/tweets/${tweetId}`)
                .expect(401);
        });

        it('403 if user is not author', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${userAToken}`)
                .send({ content: 'another tweet' });

            const id = res.body.id;

            await request(app.getHttpServer())
                .delete(`/api/tweets/${id}`)
                .set('Authorization', `Bearer ${userBToken}`)
                .expect(403);
        });

        it('404 if tweet does not exist', async () => {
            await request(app.getHttpServer())
                .delete(`/api/tweets/00000000-0000-0000-0000-000000000000`)
                .set('Authorization', `Bearer ${userAToken}`)
                .expect(404);
        });

        it('400 if id is not uuid', async () => {
            await request(app.getHttpServer())
                .delete(`/api/tweets/not-a-uuid`)
                .set('Authorization', `Bearer ${userAToken}`)
                .expect(400);
        });
    });

    describe('GET /api/tweets/timeline', () => {
        let timelineUserAToken: string;
        let timelineUserBToken: string;
        let timelineUserAId: string;
        let timelineUserBId: string;

        const setupTweets = async () => {
            await dataSource.query(
                `DELETE FROM tweets WHERE user_id = $1`,
                [timelineUserAId],
            );
            await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${timelineUserAToken}`)
                .send({ content: 't1' });
            await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${timelineUserAToken}`)
                .send({ content: 't2' });
            await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${timelineUserAToken}`)
                .send({ content: 't3' });
        };

        const ensureFollow = async () => {
            await dataSource.query(
                `INSERT INTO follows (id, follower_id, following_id, created_at)
                    VALUES (gen_random_uuid(), $1, $2, now())
                    ON CONFLICT DO NOTHING`,
                [timelineUserBId, timelineUserAId],
            );
        };

        beforeAll(async () => {
            const suffix = Math.random().toString(36).substring(2, 8);

            const resA = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: `timeline-a-${suffix}@tweets-test.com`,
                    password: 'Password123',
                    username: `timelinea${suffix}`,
                });

            expect(resA.status).toBe(201);
            timelineUserAToken = resA.body.token;
            timelineUserAId = resA.body.user.id;

            const resB = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: `timeline-b-${suffix}@tweets-test.com`,
                    password: 'Password123',
                    username: `timelineb${suffix}`,
                });

            expect(resB.status).toBe(201);
            timelineUserBToken = resB.body.token;
            timelineUserBId = resB.body.user.id;

            await ensureFollow();
            await setupTweets();
        });

        it('200 with empty data when user follows no one', async () => {
            const suffix = Math.random().toString(36).substring(2, 8);
            const resC = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: `c${suffix}@tweets-test.com`,
                    password: 'Password123',
                    username: `userc${suffix}`,
                });

            const res = await request(app.getHttpServer())
                .get('/api/tweets/timeline')
                .set('Authorization', `Bearer ${resC.body.token}`)
                .expect(200);

            expect(res.body).toEqual({ data: [], nextCursor: null, hasMore: false });
        });

        it('returns tweets from followed users ordered DESC', async () => {
            await ensureFollow();
            await setupTweets();

            const res = await request(app.getHttpServer())
                .get('/api/tweets/timeline')
                .set('Authorization', `Bearer ${timelineUserBToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(3);
            const contents = res.body.data.map((t: any) => t.content);
            expect(contents).toEqual(['t3', 't2', 't1']);

            res.body.data.forEach((t: any) => {
                expect(t.user).toHaveProperty('id');
                expect(t.user).toHaveProperty('username');
                expect(t.user).toHaveProperty('displayName');
                expect(t.user).toHaveProperty('avatarUrl');
                expect(t.user).not.toHaveProperty('password');
                expect(t.user).not.toHaveProperty('email');
                expect(t.user).not.toHaveProperty('isActive');
                expect(t).toHaveProperty('liked');
            });
        });

        it('cursor pagination works correctly', async () => {
            await ensureFollow();

            await dataSource.query(
                `DELETE FROM tweets WHERE user_id IN ($1, $2)`,
                [timelineUserAId, timelineUserBId]
            );

            // insertar directamente con SQL para garantizar timestamps únicos y controlados
            for (let i = 0; i < 25; i++) {
                await dataSource.query(
                    `INSERT INTO tweets (
                        id,
                        user_id,
                        content,
                        likes_count,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        gen_random_uuid(),
                        $1,
                        $2,
                        0,
                        NOW() - ($3 * INTERVAL '1 second'),
                        NOW() - ($3 * INTERVAL '1 second')
                    )`,
                    [timelineUserAId, `tweet-${i}`, 25 - i],
                );
            }

            const page1 = await request(app.getHttpServer())
                .get('/api/tweets/timeline?limit=20')
                .set('Authorization', `Bearer ${timelineUserBToken}`)
                .expect(200);

            expect(page1.body.hasMore).toBe(true);
            expect(page1.body.nextCursor).toBeTruthy();
            expect(page1.body.data.length).toBe(20);

            const page2 = await request(app.getHttpServer())
                .get(
                    `/api/tweets/timeline?cursor=${encodeURIComponent(
                        page1.body.nextCursor,
                    )}`,
                )
                .set('Authorization', `Bearer ${timelineUserBToken}`)
                .expect(200);

            expect(page2.body.hasMore).toBe(false);
            expect(page2.body.data.length).toBe(5);
            expect(
                page1.body.data.length + page2.body.data.length,
            ).toBe(25);

            // no hay duplicados entre páginas
            const page1Ids = new Set(
                page1.body.data.map((t: any) => t.id),
            );

            page2.body.data.forEach((t: any) => {
                expect(page1Ids.has(t.id)).toBe(false);
            });

            // tweets de page2 son más viejos que el cursor
            const decodedCursor = JSON.parse(
                Buffer.from(
                    page1.body.nextCursor,
                    'base64',
                ).toString(),
            );

            const cursorDate = new Date(decodedCursor.createdAt);

            page2.body.data.forEach((t: any) => {
                expect(
                    new Date(t.createdAt).getTime(),
                ).toBeLessThanOrEqual(cursorDate.getTime());
            });
        });

        it('respects limit param', async () => {
            const limited = await request(app.getHttpServer())
                .get('/api/tweets/timeline?limit=5')
                .set('Authorization', `Bearer ${timelineUserBToken}`)
                .expect(200);

            expect(limited.body.data.length).toBeLessThanOrEqual(5);
        });


        it('clamps limit to max 50', async () => {
            await ensureFollow();
            await dataSource.query(
                `DELETE FROM tweets WHERE user_id = $1`,
                [timelineUserAId]
            );

            // usar SQL directo en lugar de Promise.all para evitar requests en vuelo
            for (let i = 0; i < 60; i++) {
                await dataSource.query(
                    `INSERT INTO tweets (id, user_id, content, likes_count, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, 0,
             NOW() - ($3 * INTERVAL '1 second'),
             NOW() - ($3 * INTERVAL '1 second'))`,
                    [timelineUserAId, `big-${i}`, 60 - i]
                );
            }

            const big = await request(app.getHttpServer())
                .get('/api/tweets/timeline?limit=100')
                .set('Authorization', `Bearer ${timelineUserBToken}`)
                .expect(200);

            expect(big.body.data.length).toBeLessThanOrEqual(50);
        });

    });

});

