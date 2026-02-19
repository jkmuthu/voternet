import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User.js';
import { Election } from './Election.js';

export enum PostType {
  ANNOUNCEMENT = 'announcement',
  POLICY = 'policy',
  EVENT = 'event',
  UPDATE = 'update',
  DEBATE = 'debate'
}

@Entity('campaign_posts')
@Index(['author', 'createdAt'])
@Index(['election', 'createdAt'])
@Index(['postType', 'isPublished'])
export class CampaignPost {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 300 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: PostType,
    default: PostType.UPDATE
  })
  postType!: PostType;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ type: 'uuid', name: 'author_id' })
  authorId!: string;

  @ManyToOne(() => Election, election => election.campaignPosts, { nullable: true })
  @JoinColumn({ name: 'election_id' })
  election?: Election;

  @Column({ type: 'uuid', name: 'election_id', nullable: true })
  electionId?: string;

  @Column({ type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ type: 'int', default: 0 })
  likesCount!: number;

  @Column({ type: 'int', default: 0 })
  commentsCount!: number;

  @Column({ type: 'int', default: 0 })
  sharesCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @OneToMany('Comment', 'post')
  comments!: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
