import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tweet } from '../../tweets/entities/tweet.entity';

@Entity({ name: 'likes' })
@Index('idx_likes_user_id', ['user_id'])
@Index('idx_likes_tweet_id', ['tweet_id'])
@Unique('uq_likes_user_tweet', ['user_id', 'tweet_id'])
export class Like {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * User who liked the tweet
     */
    @ManyToOne(() => User, { eager: false, nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column('uuid', { name: 'user_id' })
    user_id!: string;

    /**
     * Tweet that was liked
     */
    @ManyToOne(() => Tweet, { eager: false, nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tweet_id' })
    tweet!: Tweet;

    @Column('uuid', { name: 'tweet_id' })
    tweet_id!: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;
}