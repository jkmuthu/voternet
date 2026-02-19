import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config/config.js';
import { User } from './entities/User.js';
import { VoterRegistration } from './entities/VoterRegistration.js';
import { Session } from './entities/Session.js';
import { AuditLog } from './entities/AuditLog.js';
import { Election } from './entities/Election.js';
import { Candidate } from './entities/Candidate.js';
import { Vote } from './entities/Vote.js';
import { CampaignPost } from './entities/CampaignPost.js';
import { Comment } from './entities/Comment.js';
import { InitialSchema1708105200000 } from './migrations/1708105200000-InitialSchema.js';
import { Phase2ElectionsVotingCivicFeed1708200000000 } from './migrations/1708200000000-Phase2ElectionsVotingCivicFeed.js';

const dbUrl = config.get('database.url');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  synchronize: false, // Use migrations in production
  logging: config.get('env') === 'development',
  entities: [
    User, 
    VoterRegistration, 
    Session, 
    AuditLog,
    Election,
    Candidate,
    Vote,
    CampaignPost,
    Comment
  ],
  migrations: [
    InitialSchema1708105200000,
    Phase2ElectionsVotingCivicFeed1708200000000
  ],
  subscribers: [],
  poolSize: config.get('env') === 'production' ? 20 : 5
});
