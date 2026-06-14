import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';

describe('Search (integration)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let searcherToken: string;
    const suffix = Math.random().toString(36).substring(2, 8);

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

        await dataSource.query(`DELETE FROM "user" WHERE email LIKE '%@search-test.com'`);

        // usuario que hace las búsquedas
        const searcherRes = await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: `searcher-${suffix}@search-test.com`,
                password: 'Password1',
                username: `searcher${suffix}`,
            });
        searcherToken = searcherRes.body.token;

        await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: `alpha-${suffix}@search-test.com`,
                password: 'Password1',
                username: `searchalpha${suffix}`,
            });

        await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: `beta-${suffix}@search-test.com`,
                password: 'Password1',
                username: `searchbeta${suffix}`,
            });

        await request(app.getHttpServer())
            .post('/api/auth/register')
            .send({
                email: `gamma-${suffix}@search-test.com`,
                password: 'Password1',
                username: `searchgamma${suffix}`,
            });
    });

    afterAll(async () => {
        await dataSource.query(`DELETE FROM "user" WHERE email LIKE '%@search-test.com'`);
        await app.close();
    });

    describe('GET /api/users/search', () => {
        it('401 without token', async () => {
            await request(app.getHttpServer())
                .get(`/api/users/search?q=searchalpha${suffix}`)
                .expect(401);
        });

        it('200 returns matches by username', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/users/search?q=searchalpha${suffix}`)
                .set('Authorization', `Bearer ${searcherToken}`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
            expect(res.body[0].username).toBe(`searchalpha${suffix}`);
        });

        it('200 returns matches by partial username', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/users/search?q=searchbeta`)
                .set('Authorization', `Bearer ${searcherToken}`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.some((u: any) => u.username.includes('searchbeta'))).toBe(true);
        });

        it('200 returns [] when no matches', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/users/search?q=xyznonexistent99999')
                .set('Authorization', `Bearer ${searcherToken}`)
                .expect(200);

            expect(res.body).toEqual([]);
        });

        it('200 returns [] with empty query', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/users/search?q=')
                .set('Authorization', `Bearer ${searcherToken}`)
                .expect(200);

            expect(res.body).toEqual([]);
        });

        it('each result has correct fields including isFollowing', async () => {
            const res = await request(app.getHttpServer())
                .get(`/api/users/search?q=searchalpha${suffix}`)
                .set('Authorization', `Bearer ${searcherToken}`)
                .expect(200);

            expect(res.body.length).toBeGreaterThanOrEqual(1);

            res.body.forEach((user: any) => {
                expect(user).toHaveProperty('id');
                expect(user).toHaveProperty('username');
                expect(user).toHaveProperty('displayName');
                expect(user).toHaveProperty('avatarUrl');
                expect(user).toHaveProperty('isFollowing');
                expect(user).not.toHaveProperty('password');
                expect(user).not.toHaveProperty('email');
                expect(user).not.toHaveProperty('isActive');
            });
        });

        it('search is case-insensitive', async () => {
            const upperRes = await request(app.getHttpServer())
                .get(`/api/users/search?q=SEARCHGAMMA`)
                .set('Authorization', `Bearer ${searcherToken}`)
                .expect(200);

            const lowerRes = await request(app.getHttpServer())
                .get(`/api/users/search?q=searchgamma`)
                .set('Authorization', `Bearer ${searcherToken}`)
                .expect(200);

            expect(upperRes.body.length).toBe(lowerRes.body.length);
            expect(upperRes.body.some((u: any) =>
                u.username.includes('searchgamma'))
            ).toBe(true);
        });

        it('returns max 20 results', async () => {
            const bulkSuffix = Math.random().toString(36).substring(2, 8);
            const creates: Promise<any>[] = [];

            for (let i = 0; i < 25; i++) {
                creates.push(
                    request(app.getHttpServer())
                        .post('/api/auth/register')
                        .send({
                            email: `bulk${i}-${bulkSuffix}@search-test.com`,
                            password: 'Password1',
                            username: `bulksearch${bulkSuffix}${i}`,
                        }),
                );
            }
            await Promise.all(creates);

            const res = await request(app.getHttpServer())
                .get(`/api/users/search?q=bulksearch${bulkSuffix}`)
                .set('Authorization', `Bearer ${searcherToken}`)
                .expect(200);

            expect(res.body.length).toBeLessThanOrEqual(20);
        });
    });
});