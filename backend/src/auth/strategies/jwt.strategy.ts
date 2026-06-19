import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { User } from '../../users/entities/user.entity';

interface JwtPayload {
    id: string;
    email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow<string>('jwtSecret'),
        });
    }

    async validate(payload: JwtPayload) {
        const { id } = payload;
        const user = await this.userRepository.findOneBy({ id });

        if (!user) throw new UnauthorizedException('Token not valid');
        if (!user.isActive) throw new UnauthorizedException('User is inactive');

        return user;
    }
}