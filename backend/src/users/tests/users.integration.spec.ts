import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';

describe('Users (integration)', () => {
    let app: INestApplication;
    let dataSource: DataSource;

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
    });

    afterAll(async () => {
        await dataSource.query(`DELETE FROM "user" WHERE email LIKE '%@users-integration.com'`);
        await app.close();
    });

    describe('GET /api/users/:username', () => {
        const profileUser = {
            email: 'profile@users-integration.com',
            password: 'Password1',
            username: 'profiletest',
        };

        beforeAll(async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(profileUser)
                .expect(201);
        });

        it('should return the public profile by username', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/users/profiletest')
                .expect(200);

            expect(res.body).toHaveProperty('email', profileUser.email);
            expect(res.body).toHaveProperty('username', profileUser.username);
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return 404 when the profile does not exist', async () => {
            await request(app.getHttpServer())
                .get('/api/users/missing-profile')
                .expect(404);
        });
    });

    describe('PATCH /api/users/me', () => {
        const meUser = {
            email: 'me@users-integration.com',
            password: 'Password1',
            username: 'metestusers',
        };

        let token: string;

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(meUser)
                .expect(201);

            token = res.body.token;
        });

        it('should update the authenticated user profile', async () => {
            const payload = {
                bio: 'Updated bio from integration test',
                avatar_url: 'https://example.com/avatar.png',
            };

            const res = await request(app.getHttpServer())
                .patch('/api/users/me')
                .set('Authorization', `Bearer ${token}`)
                .send(payload)
                .expect(200);

            expect(res.body).toHaveProperty('bio', payload.bio);
            expect(res.body).toHaveProperty('avatar_url', payload.avatar_url);
            expect(res.body).toHaveProperty('email', meUser.email);
        });

        it('should return 401 without token', async () => {
            await request(app.getHttpServer())
                .patch('/api/users/me')
                .send({ bio: 'no auth' })
                .expect(401);
        });

        it('should reject invalid profile payloads', async () => {
            await request(app.getHttpServer())
                .patch('/api/users/me')
                .set('Authorization', `Bearer ${token}`)
                .send({ bio: 123 })
                .expect(400);
        });
    });
});