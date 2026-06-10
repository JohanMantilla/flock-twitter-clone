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

@Entity({ name: 'follows' })
@Index('idx_follows_follower_id', ['follower_id'])
@Index('idx_follows_following_id', ['following_id'])
@Unique('uq_follows_follower_following', ['follower_id', 'following_id'])
export class Follow {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * User who follows another user
     */
    @ManyToOne(() => User, { eager: false, nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'follower_id' })
    follower!: User;

    @Column('uuid', { name: 'follower_id' })
    follower_id!: string;

    /**
     * User being followed
     */
    @ManyToOne(() => User, { eager: false, nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'following_id' })
    following!: User;

    @Column('uuid', { name: 'following_id' })
    following_id!: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;
}