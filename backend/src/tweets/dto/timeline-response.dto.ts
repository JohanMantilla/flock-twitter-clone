import { Tweet } from '../entities/tweet.entity';

export class TimelineResponseDto {
    data: Tweet[];
    nextCursor: string | null;
    hasMore: boolean;
}