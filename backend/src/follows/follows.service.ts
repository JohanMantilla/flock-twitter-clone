import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';
import { FollowResponseDto } from './dto/follow-response.dto';

@Injectable()
export class FollowsService {
    constructor(
        @InjectRepository(Follow)
        private readonly followRepo: Repository<Follow>,

        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) { }


    async follow(currentUser: User, targetUsername: string) {
        const targetUser = await this.userRepo.findOne({
            where: { username: targetUsername.toLowerCase() },
            select: { id: true },
        });

        if (!targetUser) throw new NotFoundException('User not found');

        if (currentUser.id === targetUser.id) {
            throw new BadRequestException('You cannot follow yourself');
        }

        const existing = await this.followRepo.findOne({
            where: {
                follower_id: currentUser.id,
                following_id: targetUser.id,
            },
        });

        if (existing) {
            throw new BadRequestException('Already following this user');
        }

        const follow = this.followRepo.create({
            follower_id: currentUser.id,
            following_id: targetUser.id,
        });

        await this.followRepo.save(follow);

        return {
            success: true,
            following: true,
        };
    }

    async unfollow(currentUser: User, targetUsername: string) {
        const targetUser = await this.userRepo.findOne({
            where: { username: targetUsername.toLowerCase() },
            select: { id: true },
        });

        if (!targetUser) throw new NotFoundException('User not found');

        const follow = await this.followRepo.findOne({
            where: {
                follower_id: currentUser.id,
                following_id: targetUser.id,
            },
        });

        if (!follow) {
            throw new NotFoundException('You are not following this user');
        }

        await this.followRepo.delete({
            follower_id: currentUser.id,
            following_id: targetUser.id,
        });

        return {
            success: true,
            following: false,
        };
    }


    async getFollowers(username: string, currentUserId?: string): Promise<FollowResponseDto[]> {
        const targetUser = await this.userRepo.findOne({
            where: { username: username.toLowerCase() },
            select: { id: true },
        });

        if (!targetUser) throw new NotFoundException('User not found');

        const follows = await this.followRepo
            .createQueryBuilder('follow')
            .innerJoinAndSelect('follow.follower', 'user')
            .where('follow.following_id = :userId', { userId: targetUser.id })
            .orderBy('follow.created_at', 'DESC')
            .select([
                'follow.id',
                'user.id',
                'user.username',
                'user.displayName',
                'user.avatarUrl',
            ])
            .getMany();

        const followingIds = await this.getMyFollowingIdsAmong(
            currentUserId,
            follows.map(f => f.follower.id),
        );

        return follows.map(f => ({
            id: f.follower.id,
            username: f.follower.username,
            displayName: f.follower.displayName ?? null,
            avatarUrl: f.follower.avatarUrl ?? null,
            isFollowing: followingIds.has(f.follower.id),
        }));
    }

    async getFollowing(username: string, currentUserId?: string): Promise<FollowResponseDto[]> {
        const targetUser = await this.userRepo.findOne({
            where: { username: username.toLowerCase() },
            select: { id: true },
        });

        if (!targetUser) throw new NotFoundException('User not found');

        const follows = await this.followRepo
            .createQueryBuilder('follow')
            .innerJoinAndSelect('follow.following', 'user')
            .where('follow.follower_id = :userId', { userId: targetUser.id })
            .orderBy('follow.created_at', 'DESC')
            .select([
                'follow.id',
                'user.id',
                'user.username',
                'user.displayName',
                'user.avatarUrl',
            ])
            .getMany();

        const followingIds = await this.getMyFollowingIdsAmong(
            currentUserId,
            follows.map(f => f.following.id),
        );

        return follows.map(f => ({
            id: f.following.id,
            username: f.following.username,
            displayName: f.following.displayName ?? null,
            avatarUrl: f.following.avatarUrl ?? null,
            isFollowing: followingIds.has(f.following.id),
        }));
    }

    private async getMyFollowingIdsAmong(
        currentUserId: string | undefined,
        candidateIds: string[],
    ): Promise<Set<string>> {
        if (!currentUserId || candidateIds.length === 0) {
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

}