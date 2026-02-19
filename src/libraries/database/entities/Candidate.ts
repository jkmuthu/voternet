import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './User.js';
import { Election } from './Election.js';

export enum PartyAffiliation {
  INDEPENDENT = 'independent',
  DEMOCRATIC = 'democratic',
  REPUBLICAN = 'republican',
  GREEN = 'green',
  LIBERTARIAN = 'libertarian',
  OTHER = 'other'
}

@Entity('candidates')
@Index(['election', 'user'])
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Election, { nullable: false })
  @JoinColumn({ name: 'election_id' })
  election!: Election;

  @Column({ type: 'uuid', name: 'election_id' })
  electionId!: string;

  @Column({ type: 'varchar', length: 200 })
  candidateName!: string;

  @Column({
    type: 'enum',
    enum: PartyAffiliation,
    default: PartyAffiliation.INDEPENDENT
  })
  partyAffiliation!: PartyAffiliation;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'text', nullable: true })
  platform?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @OneToMany('Vote', 'candidate')
  votes!: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
