import { Body, Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { CreateTweetDto } from './dto/create-tweet.dto';
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
    remove(@Param('id') id: string, @GetUser() user: User) {
        return this.tweetsService.remove(id, user);
    }
}