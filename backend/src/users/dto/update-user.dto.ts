import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {

    @IsOptional()
    @IsString()
    @MaxLength(160)
    bio?: string;

    @IsOptional()
    @IsString()
    avatar_url?: string;
}
