import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../follows/entities/follow.entity';
import { User } from '../users/entities/user.entity';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { TimelineResponseDto } from './dto/timeline-response.dto';
import { Tweet } from './entities/tweet.entity';

@Injectable()
export class TweetsService {
    constructor(
        @InjectRepository(Tweet)
        private readonly tweetRepository: Repository<Tweet>,
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

        if (!tweet) {
            throw new NotFoundException('Tweet not found');
        }

        if (tweet.user.id !== user.id) {
            throw new ForbiddenException('You are not the author of this tweet');
        }

        try {
            await this.tweetRepository.remove(tweet);
        } catch (error) {
            return this.handleDBErrors(error);
        }
    }

    async getTimeline(userId: string, cursor?: string, limit = 20): Promise<TimelineResponseDto> {
        const take = Math.min(limit, 50);

        if (cursor) {
            const parsed = new Date(cursor);
            if (isNaN(parsed.getTime())) {
                throw new BadRequestException('Invalid cursor');
            }
            cursor = parsed.toISOString();
        }

        const qb = this.tweetRepository
            .createQueryBuilder('tweet')
            .innerJoin(Follow, 'follow', 'follow.following_id = tweet.user_id')
            .leftJoinAndSelect('tweet.user', 'user')
            .where('follow.follower_id = :userId', { userId })
            .orderBy('tweet.created_at', 'DESC')
            .take(take + 1)
            .select(['tweet', 'user.id', 'user.username', 'user.displayName', 'user.avatarUrl']);

        if (cursor) {
            qb.andWhere('tweet.created_at < :cursor', { cursor: new Date(cursor) });
        } else {
            qb.andWhere('tweet.created_at <= :now', { now: new Date() });
        }

        const tweets = await qb.getMany();
        const hasMore = tweets.length > take;

        if (hasMore) {
            tweets.pop();
        }

        return {
            data: tweets,
            nextCursor: hasMore ? tweets[tweets.length - 1].createdAt.toISOString() : null,
            hasMore,
        };
    }

    handleDBErrors(error: any): never {
        if (error.code === '23505') {
            throw new BadRequestException(error.detail);
        }

        throw new InternalServerErrorException('Please check server logs');
    }
}