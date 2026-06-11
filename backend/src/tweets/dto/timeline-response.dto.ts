import { SafeTweetDto } from './safe-tweet.dto';

export class TimelineResponseDto {
    data: SafeTweetDto[];
    nextCursor: string | null;
    hasMore: boolean;
}