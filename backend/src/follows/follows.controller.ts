import { Controller, Post, Delete, Param, UseGuards, Get } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { FollowResponseDto } from './dto/follow-response.dto';

@Controller('users')
export class FollowsController {
    constructor(private readonly followsService: FollowsService) { }

    @Post(':username/follow')
    @UseGuards(JwtAuthGuard)
    follow(
        @GetUser() currentUser: User,
        @Param('username') username: string,
    ) {
        return this.followsService.follow(currentUser, username);
    }

    @Delete(':username/follow')
    @UseGuards(JwtAuthGuard)
    unfollow(
        @GetUser() currentUser: User,
        @Param('username') username: string,
    ) {
        return this.followsService.unfollow(currentUser, username);
    }

    @Get(':username/followers')
    @UseGuards(JwtAuthGuard)
    getFollowers(
        @Param('username') username: string,
        @GetUser() currentUser: User,
    ): Promise<FollowResponseDto[]> {
        return this.followsService.getFollowers(username, currentUser.id);
    }

    @Get(':username/following')
    @UseGuards(JwtAuthGuard)
    getFollowing(
        @Param('username') username: string,
        @GetUser() currentUser: User,
    ): Promise<FollowResponseDto[]> {
        return this.followsService.getFollowing(username, currentUser.id);
    }
}