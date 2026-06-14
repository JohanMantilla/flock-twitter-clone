import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SearchUserDto } from './dto/search-user.dto';
import { Follow } from '../follows/entities/follow.entity';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
  ) { }

  findAll() {
    return this.userRepository.find();
  }

  async findByUsername(username: string) {
    const normalizedUsername = username.toLowerCase().trim();
    const user = await this.userRepository.findOneBy({
      username: normalizedUsername,
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getStats(username: string) {
    const user = await this.userRepository.findOne({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const [tweetsCount, followersCount, followingCount] = await Promise.all([
      this.userRepository.query(
        'SELECT COUNT(*) FROM tweets WHERE user_id = $1', [user.id]
      ),
      this.userRepository.query(
        'SELECT COUNT(*) FROM follows WHERE following_id = $1', [user.id]
      ),
      this.userRepository.query(
        'SELECT COUNT(*) FROM follows WHERE follower_id = $1', [user.id]
      ),
    ]);

    return {
      tweetsCount: parseInt(tweetsCount[0].count),
      followersCount: parseInt(followersCount[0].count),
      followingCount: parseInt(followingCount[0].count),
    };
  }

  async updateMe(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) throw new NotFoundException('User not found');

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      return this.handleDBErrors(error);
    }
  }

  async search(query: string, currentUserId: string): Promise<SearchUserDto[]> {
    const sanitized = query.trim().replace(/\s+/g, ' ').substring(0, 100);

    if (!sanitized) return [];

    const term = '%' + sanitized + '%';

    const users = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.displayName',
        'user.avatarUrl',
      ])
      .where('LOWER(user.username) LIKE LOWER(:term)', { term })
      .orWhere('LOWER(user.displayName) LIKE LOWER(:term)', { term })
      .orderBy('user.username', 'ASC')
      .limit(20)
      .getMany();

    const followingIds = await this.getMyFollowingIdsAmong(
      currentUserId,
      users.map(u => u.id),
    );

    return users.map(user => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? null,
      avatarUrl: user.avatarUrl ?? null,
      isFollowing: followingIds.has(user.id),
    }));
  }

  async getUserTweets(username: string, cursor?: string, limit = 20) {
    const user = await this.userRepository.findOne({
      where: { username: username.toLowerCase() },
      select: { id: true },
    });

    if (!user) throw new NotFoundException('User not found');

    let limitInt = Math.floor(Number(limit));
    if (!Number.isFinite(limitInt) || limitInt <= 0) limitInt = 20;
    const take = Math.min(limitInt, 50);

    if (cursor) {
      const parsed = new Date(cursor);
      if (isNaN(parsed.getTime())) throw new BadRequestException('Invalid cursor');
      cursor = parsed.toISOString();
    }

    const qb = this.userRepository.manager
      .getRepository('tweets')
      .createQueryBuilder('tweet')
      .leftJoinAndSelect('tweet.user', 'user')
      .where('tweet.user_id = :userId', { userId: user.id })
      .orderBy('tweet.created_at', 'DESC')
      .take(take + 1);

    if (cursor) {
      qb.andWhere('tweet.created_at < :cursor', { cursor: new Date(cursor) });
    }

    const tweets = await qb.getMany();
    const hasMore = tweets.length > take;
    if (hasMore) tweets.pop();

    const nextCursor = hasMore && tweets.length > 0
      ? tweets[tweets.length - 1].createdAt.toISOString()
      : null;

    return {
      data: tweets.map(tweet => ({
        ...tweet,
        user: {
          id: tweet.user.id,
          username: tweet.user.username,
          displayName: tweet.user.displayName,
          avatarUrl: tweet.user.avatarUrl,
        },
      })),
      nextCursor,
      hasMore,
    };
  }

  private async getMyFollowingIdsAmong(
    currentUserId: string,
    candidateIds: string[],
  ): Promise<Set<string>> {
    if (candidateIds.length === 0) {
      return new Set();
    }

    const myFollows = await this.followRepo
      .createQueryBuilder('follow')
      .where('follow.follower_id = :currentUserId', { currentUserId })
      .andWhere('follow.following_id IN (:...candidateIds)', { candidateIds })
      .select(['follow.following_id'])
      .getMany();

    return new Set(myFollows.map(f => f.following_id));
  }

  handleDBErrors(error: any): never {
    if (error.code === '23505') {
      if (error.detail?.includes('(email)=(')) {
        throw new BadRequestException('Email already in use');
      }
      if (error.detail?.includes('(username)=(')) {
        throw new BadRequestException('Username already in use');
      }
      throw new BadRequestException(error.detail);
    }

    throw new InternalServerErrorException('Please check server logs');
  }
}