import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index, Unique } from 'typeorm';
import { User } from './User.js';
import { Election } from './Election.js';
import { Candidate } from './Candidate.js';

@Entity('votes')
@Unique(['election', 'voter']) // One vote per election per voter
@Index(['election', 'createdAt'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Election, election => election.votes, { nullable: false })
  @JoinColumn({ name: 'election_id' })
  election!: Election;

  @Column({ type: 'uuid', name: 'election_id' })
  electionId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'voter_id' })
  voter!: User;

  @Column({ type: 'uuid', name: 'voter_id' })
  voterId!: string;

  @ManyToOne(() => Candidate, candidate => candidate.votes, { nullable: false })
  @JoinColumn({ name: 'candidate_id' })
  candidate!: Candidate;

  @Column({ type: 'uuid', name: 'candidate_id' })
  candidateId!: string;

  @Column({ type: 'varchar', length: 255 }) // Encrypted vote hash for verification
  voteHash!: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ type: 'boolean', default: true })
  isValid!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
