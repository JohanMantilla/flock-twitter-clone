import { BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Tweet } from '../../tweets/entities/tweet.entity';
import { Follow } from '../../follows/entities/follow.entity';

@Entity()
export class User {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text', {
        unique: true,
    })
    email!: string;

    @Column('text', {
        select: false
    })
    password!: string;

    @Column('text', { unique: true })
    username!: string;

    @Column('text', { nullable: true, name: 'display_name' })
    displayName!: string;

    @Column('text', { nullable: true })
    bio!: string;

    @Column('text', { nullable: true, name: 'avatar_url' })
    avatarUrl!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @Column('bool', {
        default: true,
    })
    isActive!: boolean;

    @OneToMany(() => Tweet, (tweet) => tweet.user)
    tweets!: Tweet[];

    @OneToMany(() => Follow, (follow) => follow.follower)
    following!: Follow[];

    @OneToMany(() => Follow, (follow) => follow.following)
    followers!: Follow[];

    @BeforeInsert()
    checkFieldsBeforeInsert() {
        this.email = this.email.toLowerCase().trim();
        this.username = this.username.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsBeforeUpdate() {
        this.checkFieldsBeforeInsert();
    }

}
