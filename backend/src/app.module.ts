import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './config/configuration';
import { envSchema } from './config/env.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigService } from '@nestjs/config';
import { TweetsModule } from './tweets/tweets.module';
import { FollowsModule } from './follows/follows.module';
import { LikesModule } from './likes/likes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envSchema,
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('db.host'),
        port: configService.getOrThrow<number>('db.port'),
        database: configService.getOrThrow<string>('db.name'),
        username: configService.getOrThrow<string>('db.username'),
        password: configService.getOrThrow<string>('db.password'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('nodeEnv') !== 'production',
      }),
    }),

    UsersModule,

    AuthModule,

    TweetsModule,

    FollowsModule,

    LikesModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
