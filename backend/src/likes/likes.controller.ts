import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { LikesService } from './likes.service';

@Controller('tweets')
export class LikesController {
  constructor(private readonly likesService: LikesService) { }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  like(
    @GetUser() currentUser: User,
    @Param('id') tweetId: string,
  ) {
    return this.likesService.like(currentUser, tweetId);
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  unlike(
    @GetUser() currentUser: User,
    @Param('id') tweetId: string,
  ) {
    return this.likesService.unlike(currentUser, tweetId);
  }
}