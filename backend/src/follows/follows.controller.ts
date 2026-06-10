import {
    Controller,
    Post,
    Delete,
    Param,
    Req,
    UseGuards,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class FollowsController {
    constructor(private readonly followsService: FollowsService) { }

    @Post(':username/follow')
    @UseGuards(JwtAuthGuard)
    async follow(@Req() req: any, @Param('username') username: string) {
        return this.followsService.follow(req.user, username);
    }

    @Delete(':username/follow')
    @UseGuards(JwtAuthGuard)
    async unfollow(@Req() req: any, @Param('username') username: string) {
        return this.followsService.unfollow(req.user, username);
    }
}