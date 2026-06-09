import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'follows' })
@Index('idx_follows_follower_id', ['follower_id'])
@Index('idx_follows_following_id', ['following_id'])
@Unique(['follower_id', 'following_id'])
export class Follow {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, { eager: false, nullable: false })
    @JoinColumn({ name: 'follower_id' })
    follower!: User;

    @Column('uuid')
    follower_id!: string;

    @ManyToOne(() => User, { eager: false, nullable: false })
    @JoinColumn({ name: 'following_id' })
    following!: User;

    @Column('uuid')
    following_id!: string;

    @CreateDateColumn({ name: 'created_at' })
    created_at!: Date;
}