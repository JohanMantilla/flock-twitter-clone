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
            new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
        );

        await app.init();
        dataSource = moduleFixture.get<DataSource>(DataSource);

        // register userA and userB
        const resA = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({ email: 'tweeter@test-integration.com', password: 'Password1', username: 'tweeteruser' });

        userAToken = resA.body.token;
        userAId = resA.body.user.id;

        const resB = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({ email: 'follower@test-integration.com', password: 'Password1', username: 'followeruser' });

        userBToken = resB.body.token;
        userBId = resB.body.user.id;
    });

    afterAll(async () => {
        await dataSource.query(`DELETE FROM tweets`);
        await dataSource.query(`DELETE FROM follows`);
        await dataSource.query(`DELETE FROM "user" WHERE email LIKE '%@test-integration.com'`);
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
            // create new tweet by userA
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
        beforeAll(async () => {
            // ensure clean tweets
            await dataSource.query(`DELETE FROM tweets`);
            // userA posts 3 tweets
            await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${userAToken}`)
                .send({ content: 't1' });

            await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${userAToken}`)
                .send({ content: 't2' });

            await request(app.getHttpServer())
                .post('/api/tweets')
                .set('Authorization', `Bearer ${userAToken}`)
                .send({ content: 't3' });
        });

        it('200 with empty data when user follows no one', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/tweets/timeline')
                .set('Authorization', `Bearer ${userBToken}`)
                .expect(200);

            expect(res.body).toEqual({ data: [], nextCursor: null, hasMore: false });
        });

        it('timeline returns tweets only from followed users and respects pagination', async () => {
            // insert follow: userB follows userA
            await dataSource.query(`INSERT INTO follows (id, follower_id, following_id, created_at) VALUES (gen_random_uuid(), $1, $2, now())`, [userBId, userAId]);

            const res = await request(app.getHttpServer())
                .get('/api/tweets/timeline')
                .set('Authorization', `Bearer ${userBToken}`)
                .expect(200);

            expect(res.body.data.length).toBe(3);
            // tweets are ordered DESC by created_at
            const contents = res.body.data.map((t: any) => t.content);
            expect(contents).toEqual(['t3', 't2', 't1']);

            // each tweet.user only contains safe fields
            res.body.data.forEach((t: any) => {
                expect(t.user).toHaveProperty('id');
                expect(t.user).toHaveProperty('username');
                expect(t.user).toHaveProperty('display_name');
                expect(t.user).toHaveProperty('avatar_url');
                expect(t.user).not.toHaveProperty('password');
                expect(t.user).not.toHaveProperty('email');
                expect(t.user).not.toHaveProperty('isActive');
            });

            // cursor pagination: create 25 tweets, request limit=20
            await dataSource.query(`DELETE FROM tweets`);
            const createPromises: Promise<any>[] = [];
            for (let i = 0; i < 25; i++) {
                createPromises.push(
                    request(app.getHttpServer())
                        .post('/api/tweets')
                        .set('Authorization', `Bearer ${userAToken}`)
                        .send({ content: `tweet-${i}` }),
                );
            }
            await Promise.all(createPromises);

            const page1 = await request(app.getHttpServer())
                .get('/api/tweets/timeline?limit=20')
                .set('Authorization', `Bearer ${userBToken}`)
                .expect(200);

            expect(page1.body.hasMore).toBe(true);
            expect(page1.body.nextCursor).toBeTruthy();

            const page2 = await request(app.getHttpServer())
                .get(`/api/tweets/timeline?cursor=${encodeURIComponent(page1.body.nextCursor)}`)
                .set('Authorization', `Bearer ${userBToken}`)
                .expect(200);

            expect(page2.body.hasMore).toBe(false);
            // 25 total -> 20 + 5
            expect(page1.body.data.length + page2.body.data.length).toBe(25);

            // limit respected
            const limited = await request(app.getHttpServer())
                .get('/api/tweets/timeline?limit=5')
                .set('Authorization', `Bearer ${userBToken}`)
                .expect(200);
            expect(limited.body.data.length).toBeLessThanOrEqual(5);

            // limit max 50
            // create 60 tweets
            await dataSource.query(`DELETE FROM tweets`);
            const p2: Promise<any>[] = [];
            for (let i = 0; i < 60; i++) {
                p2.push(
                    request(app.getHttpServer())
                        .post('/api/tweets')
                        .set('Authorization', `Bearer ${userAToken}`)
                        .send({ content: `big-${i}` }),
                );
            }
            await Promise.all(p2);

            const big = await request(app.getHttpServer())
                .get('/api/tweets/timeline?limit=100')
                .set('Authorization', `Bearer ${userBToken}`)
                .expect(200);

            expect(big.body.data.length).toBeLessThanOrEqual(50);
        });
    });
});

