import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User.js';
import { CampaignPost } from './CampaignPost.js';

@Entity('comments')
@Index(['post', 'createdAt'])
@Index(['author', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  content!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ type: 'uuid', name: 'author_id' })
  authorId!: string;

  @ManyToOne(() => CampaignPost, post => post.comments, { nullable: false })
  @JoinColumn({ name: 'post_id' })
  post!: CampaignPost;

  @Column({ type: 'uuid', name: 'post_id' })
  postId!: string;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment?: Comment;

  @Column({ type: 'uuid', name: 'parent_comment_id', nullable: true })
  parentCommentId?: string;

  @Column({ type: 'int', default: 0 })
  likesCount!: number;

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
