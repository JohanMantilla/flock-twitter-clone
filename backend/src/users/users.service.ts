import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) { }

  findAll() {
    return this.userRepository.find();
  }

  async findByUsername(username: string) {
    const normalizedUsername = username.toLowerCase().trim();
    const user = await this.userRepository.findOneBy({ username: normalizedUsername });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      return this.handleDBErrors(error);
    }
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

    throw new InternalServerErrorException('Please check server logs');
  }
}
