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
    if (!(await bcrypt.compare(password, user.password))) return null;
    if (!user.isActive) throw new UnauthorizedException('User is inactive');

    const { password: _, ...result } = user;
    return result;
  }

  async register(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;
    const normalizedEmail = createUserDto.email.toLowerCase().trim();
    const normalizedUsername = createUserDto.username.toLowerCase().trim();

    const existing = await this.userRepository.findOneBy({
      email: normalizedEmail,
    });
    if (existing) throw new BadRequestException('Email already in use');

    const existingUsername = await this.userRepository.findOneBy({
      username: normalizedUsername,
    });

    if (existingUsername) throw new BadRequestException('Username already in use');

    const user = this.userRepository.create({
      ...userData,
      email: normalizedEmail,
      username: normalizedUsername,
      displayName: createUserDto.username,
      password: await bcrypt.hash(password, 10),
    });

    try {
      await this.userRepository.save(user);
    } catch (error) {
      return this.handleDBErrors(error);
    }
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

  handleDBErrors(error: any): never {
    if (error.code === '23505') {
      if (error.detail?.includes('(email)=(')) {
        throw new BadRequestException('Email already in use');
      }

      if (error.detail?.includes('(username)=(')) {
        throw new BadRequestException('Username already in use');
      }

      throw new BadRequestException(error.detail);
    }

    throw new Error(error);
  }

  async getMe(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}