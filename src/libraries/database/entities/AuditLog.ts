import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from './User.js';

@Entity('audit_logs')
@Index(['actionByUserId', 'createdAt'])
@Index(['actionType'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'action_by_user_id' })
  actionByUser?: User;

  @Column({ type: 'uuid', nullable: true, name: 'action_by_user_id' })
  actionByUserId?: string;

  @Column({ type: 'varchar', length: 100 })
  actionType!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  resourceType?: string;

  @Column({ type: 'uuid', nullable: true })
  resourceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValue?: any;

  @Column({ type: 'jsonb', nullable: true })
  newValue?: any;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
