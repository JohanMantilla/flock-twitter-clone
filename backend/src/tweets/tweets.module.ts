import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from '../follows/entities/follow.entity';
import { Tweet } from './entities/tweet.entity';
import { TweetsController } from './tweets.controller';
import { TweetsService } from './tweets.service';
import { Like } from '../likes/entities/like.entity';


@Module({
    imports: [TypeOrmModule.forFeature([Tweet, Follow, Like])],
    controllers: [TweetsController],
    providers: [TweetsService],
})
export class TweetsModule { }