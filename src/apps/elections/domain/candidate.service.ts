import { Repository } from 'typeorm';
import { AppDataSource } from '../../../libraries/database/data-source.js';
import { Candidate, PartyAffiliation } from '../../../libraries/database/entities/Candidate.js';
import { Election, ElectionStatus } from '../../../libraries/database/entities/Election.js';
import { User, UserRole } from '../../../libraries/database/entities/User.js';
import { VoterRegistration } from '../../../libraries/database/entities/VoterRegistration.js';

export interface RegisterCandidateDto {
  electionId: string;
  candidateName: string;
  partyAffiliation: PartyAffiliation;
  bio?: string;
  platform?: string;
  website?: string;
  userId: string;
}

export interface UpdateCandidateDto {
  candidateName?: string;
  partyAffiliation?: PartyAffiliation;
  bio?: string;
  platform?: string;
  website?: string;
}

export class CandidateService {
  private candidateRepo: Repository<Candidate>;
  private electionRepo: Repository<Election>;
  private voterRegRepo: Repository<VoterRegistration>;
  private userRepo: Repository<User>;

  constructor() {
    this.candidateRepo = AppDataSource.getRepository(Candidate);
    this.electionRepo = AppDataSource.getRepository(Election);
    this.voterRegRepo = AppDataSource.getRepository(VoterRegistration);
    this.userRepo = AppDataSource.getRepository(User);
  }

  /**
   * Register as a candidate for an election
   */
  async registerCandidate(data: RegisterCandidateDto, user: User): Promise<Candidate> {
    // Verify election exists
    const election = await this.electionRepo.findOne({
      where: { id: data.electionId }
    });

    if (!election) {
      throw new Error('Election not found');
    }

    // Can only register for draft or published elections
    if (election.status !== ElectionStatus.DRAFT && election.status !== ElectionStatus.PUBLISHED) {
      throw new Error('Can only register for draft or published elections');
    }

    // Check if registration deadline has passed (if election is published)
    if (election.status === ElectionStatus.PUBLISHED && new Date() >= election.startDate) {
      throw new Error('Candidate registration closed - election has started');
    }

    // Check if user is already a candidate in this election
    const existingCandidate = await this.candidateRepo.findOne({
      where: {
        userId: data.userId,
        electionId: data.electionId
      }
    });

    if (existingCandidate) {
      throw new Error('User is already registered as a candidate in this election');
    }

    // Verify user is a registered voter
    const voterReg = await this.voterRegRepo.findOne({
      where: { userId: data.userId }
    });

    if (!voterReg || !voterReg.isEligible) {
      throw new Error('Must be a registered and eligible voter to run as candidate');
    }

    // Create candidate
    const candidate = this.candidateRepo.create({
      userId: data.userId,
      electionId: data.electionId,
      candidateName: data.candidateName,
      partyAffiliation: data.partyAffiliation,
      bio: data.bio,
      platform: data.platform,
      website: data.website,
      isActive: true,
      isVerified: false
    });

    await this.candidateRepo.save(candidate);
    return candidate;
  }

  /**
   * List all candidates for an election
   */
  async listCandidates(electionId: string, includeInactive = false): Promise<Candidate[]> {
    const query = this.candidateRepo.createQueryBuilder('candidate')
      .leftJoinAndSelect('candidate.user', 'user')
      .where('candidate.electionId = :electionId', { electionId })
      .orderBy('candidate.candidateName', 'ASC');

    if (!includeInactive) {
      query.andWhere('candidate.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  /**
   * Get candidate by ID with details
   */
  async getCandidateById(candidateId: string): Promise<Candidate> {
    const candidate = await this.candidateRepo.findOne({
      where: { id: candidateId },
      relations: ['user', 'election']
    });

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    return candidate;
  }

  /**
   * Update candidate profile
   */
  async updateCandidate(candidateId: string, data: UpdateCandidateDto, user: User): Promise<Candidate> {
    const candidate = await this.getCandidateById(candidateId);

    // Only the candidate themselves or admins can update
    if (candidate.userId !== user.id && user.role !== UserRole.ADMIN) {
      throw new Error('Not authorized to update this candidate profile');
    }

    // Check if election has started (can't update during active voting)
    if (candidate.election.status === ElectionStatus.ACTIVE) {
      throw new Error('Cannot update candidate profile during active voting');
    }

    // Update fields
    if (data.candidateName) candidate.candidateName = data.candidateName;
    if (data.partyAffiliation) candidate.partyAffiliation = data.partyAffiliation;
    if (data.bio !== undefined) candidate.bio = data.bio;
    if (data.platform !== undefined) candidate.platform = data.platform;
    if (data.website !== undefined) candidate.website = data.website;

    await this.candidateRepo.save(candidate);
    return candidate;
  }

  /**
   * Verify candidate (admin/election_official only)
   */
  async verifyCandidate(candidateId: string, user: User): Promise<Candidate> {
    // Authorization check
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.ELECTION_OFFICIAL) {
      throw new Error('Only admins and election officials can verify candidates');
    }

    const candidate = await this.getCandidateById(candidateId);

    candidate.isVerified = true;
    candidate.verifiedAt = new Date();
    await this.candidateRepo.save(candidate);

    return candidate;
  }

  /**
   * Deactivate candidate (withdraw from election)
   */
  async deactivateCandidate(candidateId: string, user: User): Promise<Candidate> {
    const candidate = await this.getCandidateById(candidateId);

    // Only the candidate themselves or admins can deactivate
    if (candidate.userId !== user.id && user.role !== UserRole.ADMIN) {
      throw new Error('Not authorized to deactivate this candidate');
    }

    // Can't withdraw during active voting
    if (candidate.election.status === ElectionStatus.ACTIVE) {
      throw new Error('Cannot withdraw during active voting');
    }

    candidate.isActive = false;
    await this.candidateRepo.save(candidate);

    return candidate;
  }

  /**
   * Reactivate candidate
   */
  async reactivateCandidate(candidateId: string, user: User): Promise<Candidate> {
    const candidate = await this.getCandidateById(candidateId);

    // Only admins can reactivate
    if (user.role !== UserRole.ADMIN) {
      throw new Error('Only admins can reactivate candidates');
    }

    // Can only reactivate if election hasn't started
    if (candidate.election.status !== ElectionStatus.DRAFT && candidate.election.status !== ElectionStatus.PUBLISHED) {
      throw new Error('Cannot reactivate candidate for elections that have started');
    }

    candidate.isActive = true;
    await this.candidateRepo.save(candidate);

    return candidate;
  }

  /**
   * Get candidate by user and election
   */
  async getCandidateByUserAndElection(userId: string, electionId: string): Promise<Candidate | null> {
    return this.candidateRepo.findOne({
      where: {
        userId,
        electionId
      },
      relations: ['user', 'election']
    });
  }

  /**
   * Check if user is a candidate in an election
   */
  async isUserCandidate(userId: string, electionId: string): Promise<boolean> {
    const candidate = await this.getCandidateByUserAndElection(userId, electionId);
    return candidate !== null && candidate.isActive;
  }

  /**
   * Get all elections where user is a candidate
   */
  async getUserCandidacies(userId: string): Promise<Candidate[]> {
    return this.candidateRepo.find({
      where: { userId },
      relations: ['election'],
      order: {
        createdAt: 'DESC'
      }
    });
  }
}
