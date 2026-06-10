import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';

describe('Follows (integration)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userAToken: string;
    let userBToken: string;
    let userAUsername: string;
    let userBUsername: string;

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

        await dataSource.query(`DELETE FROM follows`);
        await dataSource.query(`DELETE FROM "user" WHERE email LIKE '%@follows-test.com'`);

        userAUsername = 'followtesta';
        userBUsername = 'followtestb';

        const resA = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: 'follow-a@follows-test.com',
                password: 'Password1',
                username: userAUsername,
            });

        expect(resA.status).toBe(201);
        userAToken = resA.body.token;

        const resB = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: 'follow-b@follows-test.com',
                password: 'Password1',
                username: userBUsername,
            });

        expect(resB.status).toBe(201);
        userBToken = resB.body.token;
    });

    afterAll(async () => {
        await dataSource.query(`DELETE FROM follows`);
        await dataSource.query(`DELETE FROM "user" WHERE email LIKE '%@follows-test.com'`);
        await app.close();
    });

    describe('POST /api/users/:username/follow', () => {
        afterEach(async () => {
            await dataSource.query(`DELETE FROM follows`);
        });

        it('201 follow exitoso', async () => {
            const res = await request(app.getHttpServer())
                .post(`/api/users/${userBUsername}/follow`)
                .set('Authorization', `Bearer ${userAToken}`)
                .expect(201);

            expect(res.body).toEqual({ success: true, following: true });
        });

        it('401 sin token', async () => {
            await request(app.getHttpServer())
                .post(`/api/users/${userBUsername}/follow`)
                .expect(401);
        });

        it('404 si el username no existe', async () => {
            await request(app.getHttpServer())
                .post('/api/users/nonexistentuser9999/follow')
                .set('Authorization', `Bearer ${userAToken}`)
                .expect(404);
        });

        it('400 si intenta seguirse a si mismo', async () => {
            await request(app.getHttpServer())
                .post(`/api/users/${userAUsername}/follow`)
                .set('Authorization', `Bearer ${userAToken}`)
                .expect(400);
        });

        it('400 si ya sigue al usuario', async () => {
            await request(app.getHttpServer())
                .post(`/api/users/${userBUsername}/follow`)
                .set('Authorization', `Bearer ${userAToken}`);

            await request(app.getHttpServer())
                .post(`/api/users/${userBUsername}/follow`)
                .set('Authorization', `Bearer ${userAToken}`)
                .expect(400);
        });
    });

    describe('DELETE /api/users/:username/follow', () => {
        beforeEach(async () => {
            await request(app.getHttpServer())
                .post(`/api/users/${userBUsername}/follow`)
                .set('Authorization', `Bearer ${userAToken}`);
        });

        afterEach(async () => {
            await dataSource.query(`DELETE FROM follows`);
        });

        it('200 al dejar de seguir exitosamente', async () => {
            const res = await request(app.getHttpServer())
                .delete(`/api/users/${userBUsername}/follow`)
                .set('Authorization', `Bearer ${userAToken}`)
                .expect(200);

            expect(res.body).toEqual({ success: true, following: false });
        });

        it('401 sin token', async () => {
            await request(app.getHttpServer())
                .delete(`/api/users/${userBUsername}/follow`)
                .expect(401);
        });

        it('404 si el username no existe', async () => {
            await request(app.getHttpServer())
                .delete('/api/users/nonexistentuser9999/follow')
                .set('Authorization', `Bearer ${userAToken}`)
                .expect(404);
        });

        it('404 si no sigue al usuario', async () => {
            await dataSource.query(`DELETE FROM follows`);

            await request(app.getHttpServer())
                .delete(`/api/users/${userBUsername}/follow`)
                .set('Authorization', `Bearer ${userAToken}`)
                .expect(404);
        });
    });

    describe('GET /api/users/:username/followers', () => {
        beforeAll(async () => {
            await dataSource.query(`DELETE FROM follows`);
            await request(app.getHttpServer())
                .post(`/api/users/${userBUsername}/follow`)
                .set('Authorization', `Bearer ${userAToken}`);
        });

        it('200 retorna lista de seguidores', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/users/${userBUsername}/followers`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });

        it('cada item tiene los campos correctos', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/users/${userBUsername}/followers`)
                .expect(200);

            const follower = res.body[0];
            expect(follower).toHaveProperty('id');
            expect(follower).toHaveProperty('username');
            expect(follower).toHaveProperty('displayName');
            expect(follower).toHaveProperty('avatarUrl');
            expect(follower).not.toHaveProperty('password');
            expect(follower).not.toHaveProperty('email');
            expect(follower).not.toHaveProperty('isActive');
        });

        it('404 si el username no existe', async () => {
            await request(app.getHttpServer())
                .get('/api/users/nonexistentuser9999/followers')
                .expect(404);
        });
    });

    describe('GET /api/users/:username/following', () => {
        it('200 retorna lista de siguiendo', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/users/${userAUsername}/following`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });

        it('cada item tiene los campos correctos', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/users/${userAUsername}/following`)
                .expect(200);

            const following = res.body[0];
            expect(following).toHaveProperty('id');
            expect(following).toHaveProperty('username');
            expect(following).toHaveProperty('displayName');
            expect(following).toHaveProperty('avatarUrl');
            expect(following).not.toHaveProperty('password');
            expect(following).not.toHaveProperty('email');
            expect(following).not.toHaveProperty('isActive');
        });

        it('404 si el username no existe', async () => {
            await request(app.getHttpServer())
                .get('/api/users/nonexistentuser9999/following')
                .expect(404);
        });
    });
});