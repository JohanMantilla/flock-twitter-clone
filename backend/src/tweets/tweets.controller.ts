import { Body, Controller, Delete, Get, Param, Query, Post, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { TimelineResponseDto } from './dto/timeline-response.dto';
import { TweetsService } from './tweets.service';

@Controller('tweets')
export class TweetsController {
    constructor(private readonly tweetsService: TweetsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@GetUser() user: User, @Body() createTweetDto: CreateTweetDto) {
        return this.tweetsService.create(user, createTweetDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
        return this.tweetsService.remove(id, user);
    }

    @Get('timeline')
    @UseGuards(JwtAuthGuard)
    getTimeline(@GetUser('id') userId: string, @Query('cursor') cursor?: string, @Query('limit') limit?: string): Promise<TimelineResponseDto> {
        const parsedLimit = limit ? Number(limit) : 20;
        const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20;

        return this.tweetsService.getTimeline(userId, cursor, safeLimit);
    }
}