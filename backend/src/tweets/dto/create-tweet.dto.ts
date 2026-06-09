import { Transform } from 'class-transformer';

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTweetDto {
    @Transform(({ value }) => value?.trim())
    @IsString()
    @IsNotEmpty()
    @MaxLength(280)
    content!: string;
}