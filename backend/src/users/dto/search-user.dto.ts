import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SearchUserDto {
    @IsUUID()
    id: string;

    @IsString()
    username: string;

    @IsOptional()
    @IsString()
    displayName: string | null;

    @IsOptional()
    @IsString()
    avatarUrl: string | null;
}