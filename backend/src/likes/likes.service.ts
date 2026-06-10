import { Injectable } from '@nestjs/common';

@Injectable()
export class LikesService {

}
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Tweet } from '../tweets/entities/tweet.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,

    @InjectRepository(Tweet)
    private readonly tweetRepo: Repository<Tweet>,

    private readonly dataSource: DataSource,
  ) { }

  async like(currentUser: User, tweetId: string): Promise<{ likesCount: number }> {
    const tweet = await this.tweetRepo.findOneBy({ id: tweetId });
    if (!tweet) throw new NotFoundException('Tweet not found');

    const existing = await this.likeRepo.findOne({
      where: { user_id: currentUser.id, tweet_id: tweetId },
    });
    if (existing) throw new BadRequestException('Already liked this tweet');

    await this.dataSource.transaction(async manager => {
      await manager.save(Like, {
        user_id: currentUser.id,
        tweet_id: tweetId,
      });
      await manager.increment(Tweet, { id: tweetId }, 'likesCount', 1);
    });

    const updated = await this.tweetRepo.findOneBy({ id: tweetId });
    return { likesCount: updated!.likesCount };
  }

  async unlike(currentUser: User, tweetId: string): Promise<{ likesCount: number }> {
    const tweet = await this.tweetRepo.findOneBy({ id: tweetId });
    if (!tweet) throw new NotFoundException('Tweet not found');

    const like = await this.likeRepo.findOne({
      where: { user_id: currentUser.id, tweet_id: tweetId },
    });
    if (!like) throw new BadRequestException('You have not liked this tweet');

    await this.dataSource.transaction(async manager => {
      await manager.remove(Like, like);
      await manager.decrement(Tweet, { id: tweetId }, 'likesCount', 1);
    });

    const updated = await this.tweetRepo.findOneBy({ id: tweetId });
    return { likesCount: updated!.likesCount };
  }
}