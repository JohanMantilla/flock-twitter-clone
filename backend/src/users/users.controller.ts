import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { SearchUserDto } from './dto/search-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(@Query('q') q: string = '', @GetUser() currentUser: User): Promise<SearchUserDto[]> {
    return this.usersService.search(q, currentUser.id);
  }

  @Get(':username/stats')
  getStats(@Param('username') username: string) {
    return this.usersService.getStats(username);
  }

  @Get(':username/tweets')
  getUserTweets(
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 20;
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20;
    return this.usersService.getUserTweets(username, cursor, safeLimit);
  }

  @Get(':username')
  findOne(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateMe(user.id, updateUserDto);
  }
}