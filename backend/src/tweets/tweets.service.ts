import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CreateTweetDto } from './dto/create-tweet.dto';
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

    handleDBErrors(error: any): never {
        if (error.code === '23505') {
            throw new BadRequestException(error.detail);
        }

        throw new InternalServerErrorException('Please check server logs');
    }
}