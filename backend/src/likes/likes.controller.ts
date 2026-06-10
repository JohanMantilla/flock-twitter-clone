import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LikesService } from './likes.service';


@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) { }

}
