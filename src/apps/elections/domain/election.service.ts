import { Repository } from 'typeorm';
import { AppDataSource } from '../../../libraries/database/data-source.js';
import { Election, ElectionStatus, ElectionType } from '../../../libraries/database/entities/Election.js';
import { User, UserRole } from '../../../libraries/database/entities/User.js';
import { Vote } from '../../../libraries/database/entities/Vote.js';
import { Candidate } from '../../../libraries/database/entities/Candidate.js';

export interface CreateElectionDto {
  title: string;
  description: string;
  electionType: ElectionType;
  startDate: Date;
  endDate: Date;
  jurisdiction?: string;
  requiresVerification?: boolean;
  allowsAbsenteeVoting?: boolean;
  createdByUserId: string;
}

export interface UpdateElectionDto {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  jurisdiction?: string;
  requiresVerification?: boolean;
  allowsAbsenteeVoting?: boolean;
}

export interface ElectionFilters {
  status?: ElectionStatus;
  electionType?: ElectionType;
  jurisdiction?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
}

export interface ElectionResults {
  electionId: string;
  election: Election;
  totalVotes: number;
  candidates: Array<{
    candidateId: string;
    candidateName: string;
    partyAffiliation: string;
    voteCount: number;
    percentage: number;
  }>;
  voterTurnout?: number;
}

export class ElectionService {
  private electionRepo: Repository<Election>;
  private voteRepo: Repository<Vote>;
  private candidateRepo: Repository<Candidate>;
  private userRepo: Repository<User>;

  constructor() {
    this.electionRepo = AppDataSource.getRepository(Election);
    this.voteRepo = AppDataSource.getRepository(Vote);
    this.candidateRepo = AppDataSource.getRepository(Candidate);
    this.userRepo = AppDataSource.getRepository(User);
  }

  /**
   * Create a new election (admin/election_official only)
   */
  async createElection(data: CreateElectionDto, user: User): Promise<Election> {
    // Authorization check
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.ELECTION_OFFICIAL) {
      throw new Error('Only admins and election officials can create elections');
    }

    // Validate dates
    if (new Date(data.startDate) >= new Date(data.endDate)) {
      throw new Error('End date must be after start date');
    }

    if (new Date(data.startDate) < new Date()) {
      throw new Error('Start date cannot be in the past');
    }

    const election = this.electionRepo.create({
      title: data.title,
      description: data.description,
      electionType: data.electionType,
      status: ElectionStatus.DRAFT,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      jurisdiction: data.jurisdiction,
      requiresVerification: data.requiresVerification ?? true,
      allowsAbsenteeVoting: data.allowsAbsenteeVoting ?? false,
      createdByUserId: data.createdByUserId
    });

    await this.electionRepo.save(election);
    return election;
  }

  /**
   * List all elections with optional filters
   */
  async listElections(filters?: ElectionFilters): Promise<Election[]> {
    const query = this.electionRepo.createQueryBuilder('election')
      .leftJoinAndSelect('election.createdBy', 'createdBy')
      .orderBy('election.startDate', 'DESC');

    if (filters?.status) {
      query.andWhere('election.status = :status', { status: filters.status });
    }

    if (filters?.electionType) {
      query.andWhere('election.electionType = :electionType', { electionType: filters.electionType });
    }

    if (filters?.jurisdiction) {
      query.andWhere('election.jurisdiction = :jurisdiction', { jurisdiction: filters.jurisdiction });
    }

    if (filters?.startDateFrom) {
      query.andWhere('election.startDate >= :startDateFrom', { startDateFrom: filters.startDateFrom });
    }

    if (filters?.startDateTo) {
      query.andWhere('election.startDate <= :startDateTo', { startDateTo: filters.startDateTo });
    }

    return query.getMany();
  }

  /**
   * Get election by ID with details
   */
  async getElectionById(electionId: string): Promise<Election> {
    const election = await this.electionRepo.findOne({
      where: { id: electionId },
      relations: ['createdBy']
    });

    if (!election) {
      throw new Error('Election not found');
    }

    return election;
  }

  /**
   * Update election details (draft only)
   */
  async updateElection(electionId: string, data: UpdateElectionDto, user: User): Promise<Election> {
    // Authorization check
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.ELECTION_OFFICIAL) {
      throw new Error('Only admins and election officials can update elections');
    }

    const election = await this.getElectionById(electionId);

    // Can only update draft elections
    if (election.status !== ElectionStatus.DRAFT) {
      throw new Error('Can only update elections in draft status');
    }

    // Validate dates if provided
    if (data.startDate || data.endDate) {
      const startDate = data.startDate ? new Date(data.startDate) : election.startDate;
      const endDate = data.endDate ? new Date(data.endDate) : election.endDate;

      if (startDate >= endDate) {
        throw new Error('End date must be after start date');
      }
    }

    // Update fields
    if (data.title) election.title = data.title;
    if (data.description) election.description = data.description;
    if (data.startDate) election.startDate = new Date(data.startDate);
    if (data.endDate) election.endDate = new Date(data.endDate);
    if (data.jurisdiction !== undefined) election.jurisdiction = data.jurisdiction;
    if (data.requiresVerification !== undefined) election.requiresVerification = data.requiresVerification;
    if (data.allowsAbsenteeVoting !== undefined) election.allowsAbsenteeVoting = data.allowsAbsenteeVoting;

    await this.electionRepo.save(election);
    return election;
  }

  /**
   * Publish an election (make it visible to voters)
   */
  async publishElection(electionId: string, user: User): Promise<Election> {
    // Authorization check
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.ELECTION_OFFICIAL) {
      throw new Error('Only admins and election officials can publish elections');
    }

    const election = await this.getElectionById(electionId);

    if (election.status !== ElectionStatus.DRAFT) {
      throw new Error('Can only publish elections in draft status');
    }

    // Check if there are any candidates
    const candidateCount = await this.candidateRepo.count({
      where: { electionId: election.id }
    });

    if (candidateCount === 0) {
      throw new Error('Cannot publish election without candidates');
    }

    election.status = ElectionStatus.PUBLISHED;
    await this.electionRepo.save(election);

    return election;
  }

  /**
   * Activate election (voting begins)
   */
  async activateElection(electionId: string, user: User): Promise<Election> {
    // Authorization check
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.ELECTION_OFFICIAL) {
      throw new Error('Only admins and election officials can activate elections');
    }

    const election = await this.getElectionById(electionId);

    if (election.status !== ElectionStatus.PUBLISHED) {
      throw new Error('Can only activate published elections');
    }

    // Check if election start date has passed
    if (new Date() < election.startDate) {
      throw new Error('Cannot activate election before start date');
    }

    election.status = ElectionStatus.ACTIVE;
    await this.electionRepo.save(election);

    return election;
  }

  /**
   * Complete election (voting ends)
   */
  async completeElection(electionId: string, user: User): Promise<Election> {
    // Authorization check
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.ELECTION_OFFICIAL) {
      throw new Error('Only admins and election officials can complete elections');
    }

    const election = await this.getElectionById(electionId);

    if (election.status !== ElectionStatus.ACTIVE) {
      throw new Error('Can only complete active elections');
    }

    // Check if election end date has passed
    if (new Date() < election.endDate) {
      throw new Error('Cannot complete election before end date');
    }

    election.status = ElectionStatus.COMPLETED;
    await this.electionRepo.save(election);

    return election;
  }

  /**
   * Cancel election
   */
  async cancelElection(electionId: string, user: User): Promise<Election> {
    // Authorization check
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.ELECTION_OFFICIAL) {
      throw new Error('Only admins and election officials can cancel elections');
    }

    const election = await this.getElectionById(electionId);

    if (election.status === ElectionStatus.COMPLETED) {
      throw new Error('Cannot cancel completed elections');
    }

    election.status = ElectionStatus.CANCELLED;
    await this.electionRepo.save(election);

    return election;
  }

  /**
   * Get election results
   */
  async getElectionResults(electionId: string): Promise<ElectionResults> {
    const election = await this.getElectionById(electionId);

    // Only show results for completed elections
    if (election.status !== ElectionStatus.COMPLETED) {
      throw new Error('Results only available for completed elections');
    }

    // Get all votes for this election
    const votes = await this.voteRepo.find({
      where: { electionId: election.id, isValid: true },
      relations: ['candidate']
    });

    const totalVotes = votes.length;

    // Count votes per candidate
    const voteCounts = votes.reduce((acc, vote) => {
      const candidateId = vote.candidateId;
      acc[candidateId] = (acc[candidateId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get all candidates with their vote counts
    const candidates = await this.candidateRepo.find({
      where: { electionId: election.id },
      relations: ['user']
    });

    const candidateResults = candidates.map(candidate => ({
      candidateId: candidate.id,
      candidateName: candidate.candidateName,
      partyAffiliation: candidate.partyAffiliation,
      voteCount: voteCounts[candidate.id] || 0,
      percentage: totalVotes > 0 ? ((voteCounts[candidate.id] || 0) / totalVotes) * 100 : 0
    }));

    // Sort by vote count descending
    candidateResults.sort((a, b) => b.voteCount - a.voteCount);

    return {
      electionId: election.id,
      election,
      totalVotes,
      candidates: candidateResults
    };
  }

  /**
   * Check if election is currently active for voting
   */
  async isElectionActiveForVoting(electionId: string): Promise<boolean> {
    const election = await this.getElectionById(electionId);
    const now = new Date();

    return (
      election.status === ElectionStatus.ACTIVE &&
      now >= election.startDate &&
      now <= election.endDate
    );
  }

  /**
   * Get active elections (currently accepting votes)
   */
  async getActiveElections(): Promise<Election[]> {
    const now = new Date();
    
    return this.electionRepo.createQueryBuilder('election')
      .where('election.status = :status', { status: ElectionStatus.ACTIVE })
      .andWhere('election.startDate <= :now', { now })
      .andWhere('election.endDate >= :now', { now })
      .orderBy('election.startDate', 'ASC')
      .getMany();
  }

  /**
   * Get upcoming elections
   */
  async getUpcomingElections(): Promise<Election[]> {
    const now = new Date();
    
    return this.electionRepo.createQueryBuilder('election')
      .where('election.status IN (:...statuses)', { 
        statuses: [ElectionStatus.PUBLISHED, ElectionStatus.ACTIVE] 
      })
      .andWhere('election.startDate > :now', { now })
      .orderBy('election.startDate', 'ASC')
      .getMany();
  }
}
