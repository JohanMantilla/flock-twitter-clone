import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true, password: true, isActive: true },
    });

    if (!user) return null;
    if (!bcrypt.compareSync(password, user.password)) return null;
    if (!user.isActive) throw new UnauthorizedException('User is inactive');

    const { password: _, ...result } = user;
    return result;
  }

  async register(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    const existing = await this.userRepository.findOneBy({
      email: createUserDto.email.toLowerCase(),
    });
    if (existing) throw new BadRequestException('Email already in use');

    const user = this.userRepository.create({
      ...userData,
      display_name: createUserDto.username,
      password: bcrypt.hashSync(password, 10),
    });

    await this.userRepository.save(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: this.getJwt({ id: user.id, email: user.email }),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    return {
      user,
      token: this.getJwt({ id: user.id, email: user.email }),
    };
  }

  private getJwt(payload: { id: string; email: string }) {
    return this.jwtService.sign(payload);
  }
}