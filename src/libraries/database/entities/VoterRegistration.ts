import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User.js';

@Entity('voter_registration')
@Index(['userId'])
@Index(['voterIdNumber'])
export class VoterRegistration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  voterIdNumber?: string;

  @Column({ type: 'date' })
  registrationDate!: Date;

  @Column({ type: 'boolean', default: true })
  isEligible!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  eligibilityVerifiedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
