import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'twitter_clone',
    synchronize: false,
    logging: false,
});

const randomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

const shuffle = <T>(arr: T[]): T[] =>
    arr.map(v => ({ v, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ v }) => v);

async function seed() {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    console.log('Starting seed...\n');

    await queryRunner.query(`DELETE FROM likes`);
    await queryRunner.query(`DELETE FROM follows`);
    await queryRunner.query(`DELETE FROM tweets`);
    await queryRunner.query(`DELETE FROM "user"`);
    console.log(' Database cleaned');

    const passwordHash = bcrypt.hashSync('Password1', 10);
    const users: any[] = [];

    for (let i = 0; i < 10; i++) {
        const rawUsername = faker.internet.username()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '');

        const username = `${rawUsername}${i}`.substring(0, 30);
        const email = faker.internet.email().toLowerCase();
        const displayName = faker.person.fullName();
        const bio = faker.lorem.sentence().substring(0, 160);
        const avatarUrl = faker.image.avatar();

        const result = await queryRunner.query(
            `INSERT INTO "user"
             (id, email, password, username, display_name, bio, avatar_url, "isActive", created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, now(), now())
             RETURNING id, email, username`,
            [email, passwordHash, username, displayName, bio, avatarUrl],
        );

        users.push(result[0]);
    }
    console.log(`✓ Created ${users.length} users`);

    const tweets: any[] = [];

    for (const user of users) {
        const count = randomInt(3, 8);

        for (let i = 0; i < count; i++) {
            const content = faker.lorem.sentence().substring(0, 200);

            const result = await queryRunner.query(
                `INSERT INTO tweets
                 (id, user_id, content, likes_count, created_at, updated_at)
                 VALUES (gen_random_uuid(), $1, $2, 0, now() - ($3 * interval '1 minute'), now())
                 RETURNING id, user_id`,
                [user.id, content, randomInt(0, 10080)],
            );

            tweets.push(result[0]);
        }
    }
    console.log(`Created ${tweets.length} tweets`);

    let followCount = 0;
    const followSet = new Set<string>();

    for (const user of users) {
        const others = shuffle(users.filter(u => u.id !== user.id));
        const toFollow = others.slice(0, randomInt(2, 5));

        for (const target of toFollow) {
            const key = `${user.id}:${target.id}`;
            if (followSet.has(key)) continue;
            followSet.add(key);

            await queryRunner.query(
                `INSERT INTO follows
                 (id, follower_id, following_id, created_at)
                 VALUES (gen_random_uuid(), $1, $2, now())
                 ON CONFLICT DO NOTHING`,
                [user.id, target.id],
            );

            followCount++;
        }
    }
    console.log(` Created ${followCount} follows`);

    let likeCount = 0;
    const likeSet = new Set<string>();

    for (const user of users) {
        const shuffledTweets = shuffle(tweets.filter(t => t.user_id !== user.id));
        const toLike = shuffledTweets.slice(0, randomInt(3, 10));

        for (const tweet of toLike) {
            const key = `${user.id}:${tweet.id}`;
            if (likeSet.has(key)) continue;
            likeSet.add(key);

            await queryRunner.query(
                `INSERT INTO likes
                 (id, user_id, tweet_id, created_at)
                 VALUES (gen_random_uuid(), $1, $2, now())
                 ON CONFLICT DO NOTHING`,
                [user.id, tweet.id],
            );

            await queryRunner.query(
                `UPDATE tweets SET likes_count = likes_count + 1 WHERE id = $1`,
                [tweet.id],
            );

            likeCount++;
        }
    }
    console.log(`✓ Created ${likeCount} likes`);

    console.log('\n Seed completed:');
    console.log(`   Users:   ${users.length}`);
    console.log(`   Tweets:  ${tweets.length}`);
    console.log(`   Follows: ${followCount}`);
    console.log(`   Likes:   ${likeCount}`);
    console.log('\n Example credentials:');
    console.log(`   Email:    ${users[0].email}`);
    console.log(`   Password: Password123`);

    await queryRunner.release();
    await AppDataSource.destroy();
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});