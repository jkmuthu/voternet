import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User.js';

export enum ElectionType {
  NATIONAL = 'national',
  STATE = 'state',
  LOCAL = 'local',
  REFERENDUM = 'referendum',
  PRIMARY = 'primary'
}

export enum ElectionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('elections')
@Index(['status', 'startDate'])
@Index(['electionType', 'status'])
export class Election {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: ElectionType,
    default: ElectionType.LOCAL
  })
  electionType!: ElectionType;

  @Column({
    type: 'enum',
    enum: ElectionStatus,
    default: ElectionStatus.DRAFT
  })
  status!: ElectionStatus;

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  endDate!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  jurisdiction?: string;

  @Column({ type: 'boolean', default: true })
  requiresVerification!: boolean;

  @Column({ type: 'boolean', default: false })
  allowsAbsenteeVoting!: boolean;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: User;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @OneToMany('Vote', 'election')
  votes!: any[];

  @OneToMany('CampaignPost', 'election')
  campaignPosts!: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
