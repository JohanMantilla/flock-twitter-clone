import { BeforeInsert, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'tweets' })
@Index(['user', 'createdAt'])
export class Tweet {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    content!: string;

    @Column('int', {
        default: 0,
        name: 'likes_count',
    })
    likesCount!: number;

    @ManyToOne(() => User, { eager: false, nullable: false })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.content = this.content.trim().replace(/\s+/g, ' ');
    }
}