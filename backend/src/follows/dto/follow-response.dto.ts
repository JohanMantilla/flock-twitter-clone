import { IsString, IsUUID, IsOptional } from 'class-validator';

export class FollowResponseDto {
    @IsUUID()
    id: string;

    @IsString()
    username: string;

    @IsString()
    @IsOptional()
    displayName: string | null;

    @IsString()
    @IsOptional()
    avatarUrl: string | null;
}