import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../follows/entities/follow.entity';
import { Like } from '../likes/entities/like.entity';
import { User } from '../users/entities/user.entity';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { TimelineResponseDto } from './dto/timeline-response.dto';
import { Tweet } from './entities/tweet.entity';

@Injectable()
export class TweetsService {
    constructor(
        @InjectRepository(Tweet)
        private readonly tweetRepository: Repository<Tweet>,

        @InjectRepository(Like)
        private readonly likeRepo: Repository<Like>,
    ) { }

    async create(user: User, createTweetDto: CreateTweetDto): Promise<Tweet> {
        const tweet = this.tweetRepository.create({
            ...createTweetDto,
            user,
        });

        try {
            const savedTweet = await this.tweetRepository.save(tweet);
            return await this.tweetRepository.findOneOrFail({
                where: { id: savedTweet.id },
                relations: { user: true },
            });
        } catch (error) {
            return this.handleDBErrors(error);
        }
    }

    async remove(id: string, user: User): Promise<void> {
        const tweet = await this.tweetRepository.findOne({
            where: { id },
            relations: { user: true },
        });

        if (!tweet) throw new NotFoundException('Tweet not found');
        if (tweet.user.id !== user.id) throw new ForbiddenException('You are not the author of this tweet');

        try {
            await this.tweetRepository.remove(tweet);
        } catch (error) {
            return this.handleDBErrors(error);
        }
    }

    async getTimeline(
        userId: string,
        cursor?: string,
        limit = 20,
    ): Promise<TimelineResponseDto> {

        const take = this.normalizeLimit(limit);

        const decodedCursor = this.decodeCursor(cursor);

        const tweets = await this.findTimelineTweets(
            userId,
            take,
            decodedCursor,
        );

        const { paginatedTweets, hasMore, nextCursor } =
            this.buildPagination(tweets, take);

        const likedTweetIds =
            await this.getLikedTweetIds(userId);

        return {
            data: this.mapSafeTweets(
                paginatedTweets,
                likedTweetIds,
            ),
            nextCursor,
            hasMore,
        };
    }

    private normalizeLimit(limit: number): number {
        let limitInt = Math.floor(Number(limit));

        if (!Number.isFinite(limitInt) || limitInt <= 0) {
            limitInt = 20;
        }

        return Math.min(limitInt, 50);
    }

    private decodeCursor(
        cursor?: string,
    ): { createdAt: Date; id: string } | null {

        if (!cursor) {
            return null;
        }

        try {
            const decoded = JSON.parse(
                Buffer.from(cursor, 'base64').toString('utf8'),
            );

            const createdAt = new Date(decoded.createdAt);

            if (
                isNaN(createdAt.getTime()) ||
                typeof decoded.id !== 'string'
            ) {
                throw new Error();
            }

            return {
                createdAt,
                id: decoded.id,
            };
        } catch {
            throw new BadRequestException('Invalid cursor');
        }
    }

    private async findTimelineTweets(
        userId: string,
        take: number,
        cursor: { createdAt: Date; id: string } | null,
    ): Promise<Tweet[]> {

        const qb = this.tweetRepository
            .createQueryBuilder('tweet')
            .leftJoin(
                Follow,
                'follow',
                `follow.following_id = tweet.user_id
             AND follow.follower_id = :userId`,
                { userId },
            )
            .leftJoinAndSelect('tweet.user', 'user')
            .where(
                `(follow.follower_id IS NOT NULL
              OR tweet.user_id = :userId)`,
                { userId },
            )
            .orderBy('tweet.created_at', 'DESC')
            .addOrderBy('tweet.id', 'DESC')
            .take(take + 1);

        if (cursor) {
            qb.andWhere(
                `(
                tweet.created_at < :cursorCreatedAt
                OR (
                    tweet.created_at = :cursorCreatedAt
                    AND tweet.id < :cursorId
                )
            )`,
                {
                    cursorCreatedAt: cursor.createdAt,
                    cursorId: cursor.id,
                },
            );
        }

        return qb.getMany();
    }

    private buildPagination(
        tweets: Tweet[],
        take: number,
    ) {
        const hasMore = tweets.length > take;

        if (hasMore) {
            tweets.pop();
        }

        const nextCursor =
            hasMore && tweets.length > 0
                ? Buffer.from(
                    JSON.stringify({
                        createdAt:
                            tweets[
                                tweets.length - 1
                            ].createdAt.toISOString(),
                        id: tweets[
                            tweets.length - 1
                        ].id,
                    }),
                ).toString('base64')
                : null;

        return {
            paginatedTweets: tweets,
            hasMore,
            nextCursor,
        };
    }

    private async getLikedTweetIds(
        userId: string,
    ): Promise<Set<string>> {

        const likedRows: { tweet_id: string }[] =
            await this.likeRepo.query(
                `SELECT tweet_id
             FROM likes
             WHERE user_id = $1`,
                [userId],
            );

        return new Set(
            likedRows.map((l) => l.tweet_id),
        );
    }

    private mapSafeTweets(
        tweets: Tweet[],
        likedTweetIds: Set<string>,
    ) {
        return tweets.map((tweet) => ({
            ...tweet,
            liked: likedTweetIds.has(tweet.id),
            user: {
                id: tweet.user.id,
                username: tweet.user.username,
                displayName: tweet.user.displayName,
                avatarUrl: tweet.user.avatarUrl,
            },
        }));
    }

    handleDBErrors(error: any): never {
        if (error.code === '23505') throw new BadRequestException(error.detail);
        throw new InternalServerErrorException('Please check server logs');
    }
}