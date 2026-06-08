import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';

describe('Auth (integration)', () => {
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
        await dataSource.query(`DELETE FROM "user" WHERE email LIKE '%@test-integration.com'`);
        await app.close();
    });

    describe('POST /api/auth/register', () => {
        const validUser = {
            email: 'register@test-integration.com',
            password: 'Password1',
            username: 'registertest',
        };

        it('should register a new user and return token', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(validUser)
                .expect(201);

            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).not.toHaveProperty('password');
            expect(res.body.user.email).toBe(validUser.email);
        });

        it('should return 400 when email already exists', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(validUser)
                .expect(400);
        });

        it('should return 400 when email is invalid', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ ...validUser, email: 'notanemail' })
                .expect(400);
        });

        it('should return 400 when password is too weak', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ ...validUser, email: 'weak@test-integration.com', password: 'weak' })
                .expect(400);
        });

        it('should return 400 when username is missing', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({ email: 'nousername@test-integration.com', password: 'Password1' })
                .expect(400);
        });
    });

    describe('POST /api/auth/login', () => {
        const loginUser = {
            email: 'login@test-integration.com',
            password: 'Password1',
            username: 'logintest',
        };

        beforeAll(async () => {
            await request(app.getHttpServer())
                .post('/api/auth/register')
                .send(loginUser);
        });

        it('should login and return token', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: loginUser.email, password: loginUser.password })
                .expect(201);

            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe(loginUser.email);
        });

        it('should return 401 when password is wrong', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: loginUser.email, password: 'WrongPass1' })
                .expect(401);
        });

        it('should return 401 when user does not exist', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({ email: 'noexiste@test-integration.com', password: 'Password1' })
                .expect(401);
        });
    });

    describe('GET /api/auth/me', () => {
        let token: string;

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/auth/register')
                .send({
                    email: 'me@test-integration.com',
                    password: 'Password1',
                    username: 'metest',
                });
            token = res.body.token;
        });

        it('should return user profile with valid token', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body).toHaveProperty('email', 'me@test-integration.com');
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return 401 without token', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .expect(401);
        });

        it('should return 401 with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/auth/me')
                .set('Authorization', 'Bearer token.invalido.xxx')
                .expect(401);
        });
    });
});
