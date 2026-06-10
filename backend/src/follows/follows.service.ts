import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from '../users/entities/user.entity';

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

        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        if (currentUser.id === targetUser.id) {
            throw new BadRequestException('You cannot follow yourself');
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

        if (!targetUser) {
            throw new NotFoundException('User not found');
        }

        const existingFollow = await this.followRepo.findOne({
            where: {
                follower_id: currentUser.id,
                following_id: targetUser.id,
            },
        });

        if (!existingFollow) {
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
}