import { BeforeInsert, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Like } from '../../likes/entities/like.entity';


@Entity({ name: 'tweets' })
@Index('idx_tweets_user_id', ['user'])
@Index('idx_tweets_created_at', ['createdAt'])
export class Tweet {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    content!: string;

    /**
     * Denormalized counter for read performance.
     * MUST be updated using transactions when implementing likes:
     * await dataSource.transaction(async manager => {
     *   await manager.save(like);
     *   await manager.increment(Tweet, { id }, 'likesCount', 1);
     * });
     */
    @Column({ default: 0, name: 'likes_count' })
    likesCount!: number;

    @ManyToOne(() => User, { eager: false, nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @OneToMany(() => Like, like => like.tweet)
    likes!: Like[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.content = this.content.trim().replace(/\s+/g, ' ');
    }
}