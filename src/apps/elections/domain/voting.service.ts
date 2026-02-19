import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { AppDataSource } from '../../../libraries/database/data-source.js';
import { Vote } from '../../../libraries/database/entities/Vote.js';
import { Election, ElectionStatus } from '../../../libraries/database/entities/Election.js';
import { Candidate } from '../../../libraries/database/entities/Candidate.js';
import { User } from '../../../libraries/database/entities/User.js';
import { VoterRegistration } from '../../../libraries/database/entities/VoterRegistration.js';

export interface CastVoteDto {
  electionId: string;
  candidateId: string;
  voterId: string;
  ipAddress?: string;
}

export interface VoteReceipt {
  voteId: string;
  electionId: string;
  electionTitle: string;
  voteHash: string;
  timestamp: Date;
  verified: boolean;
}

export class VotingService {
  private voteRepo: Repository<Vote>;
  private electionRepo: Repository<Election>;
  private candidateRepo: Repository<Candidate>;
  private voterRegRepo: Repository<VoterRegistration>;

  constructor() {
    this.voteRepo = AppDataSource.getRepository(Vote);
    this.electionRepo = AppDataSource.getRepository(Election);
    this.candidateRepo = AppDataSource.getRepository(Candidate);
    this.voterRegRepo = AppDataSource.getRepository(VoterRegistration);
  }

  /**
   * Cast a vote in an election
   */
  async castVote(data: CastVoteDto, user: User): Promise<VoteReceipt> {
    // Verify voter authorization
    if (data.voterId !== user.id) {
      throw new Error('Cannot vote on behalf of another user');
    }

    // Verify election exists and is active
    const election = await this.electionRepo.findOne({
      where: { id: data.electionId }
    });

    if (!election) {
      throw new Error('Election not found');
    }

    if (election.status !== ElectionStatus.ACTIVE) {
      throw new Error('Election is not currently accepting votes');
    }

    // Check if voting period is valid
    const now = new Date();
    if (now < election.startDate || now > election.endDate) {
      throw new Error('Voting period has not started or has ended');
    }

    // Verify voter eligibility
    const voterReg = await this.voterRegRepo.findOne({
      where: { userId: data.voterId }
    });

    if (!voterReg) {
      throw new Error('Voter is not registered');
    }

    if (!voterReg.isEligible) {
      throw new Error('Voter is not eligible to vote');
    }

    // Verify voter meets verification requirements
    if (election.requiresVerification && !voterReg.eligibilityVerifiedAt) {
      throw new Error('Voter eligibility must be verified to vote in this election');
    }

    // Check if voter has already voted
    const existingVote = await this.voteRepo.findOne({
      where: {
        electionId: data.electionId,
        voterId: data.voterId
      }
    });

    if (existingVote) {
      throw new Error('Voter has already cast a vote in this election');
    }

    // Verify candidate exists and is active
    const candidate = await this.candidateRepo.findOne({
      where: {
        id: data.candidateId,
        electionId: data.electionId
      }
    });

    if (!candidate) {
      throw new Error('Candidate not found in this election');
    }

    if (!candidate.isActive) {
      throw new Error('Candidate is not active');
    }

    // Generate vote hash for verification (without revealing vote)
    const voteHash = this.generateVoteHash(
      data.electionId,
      data.voterId,
      data.candidateId,
      now.toISOString()
    );

    // Create and save vote
    const vote = this.voteRepo.create({
      electionId: data.electionId,
      voterId: data.voterId,
      candidateId: data.candidateId,
      voteHash,
      ipAddress: data.ipAddress,
      isValid: true,
      verifiedAt: now
    });

    await this.voteRepo.save(vote);

    // Return vote receipt (anonymized)
    return {
      voteId: vote.id,
      electionId: election.id,
      electionTitle: election.title,
      voteHash: vote.voteHash,
      timestamp: vote.createdAt,
      verified: true
    };
  }

  /**
   * Check if user has voted in an election
   */
  async hasUserVoted(userId: string, electionId: string): Promise<boolean> {
    const vote = await this.voteRepo.findOne({
      where: {
        voterId: userId,
        electionId: electionId
      }
    });

    return vote !== null;
  }

  /**
   * Get user's vote receipt (without revealing who they voted for)
   */
  async getVoteReceipt(userId: string, electionId: string): Promise<VoteReceipt | null> {
    const vote = await this.voteRepo.findOne({
      where: {
        voterId: userId,
        electionId: electionId
      },
      relations: ['election']
    });

    if (!vote) {
      return null;
    }

    return {
      voteId: vote.id,
      electionId: vote.electionId,
      electionTitle: vote.election.title,
      voteHash: vote.voteHash,
      timestamp: vote.createdAt,
      verified: vote.isValid && vote.verifiedAt !== null
    };
  }

  /**
   * Verify vote hash (for audit purposes)
   */
  async verifyVoteHash(voteId: string, voteHash: string): Promise<boolean> {
    const vote = await this.voteRepo.findOne({
      where: { id: voteId }
    });

    if (!vote) {
      return false;
    }

    return vote.voteHash === voteHash;
  }

  /**
   * Get vote count for a specific election
   */
  async getElectionVoteCount(electionId: string): Promise<number> {
    return this.voteRepo.count({
      where: {
        electionId,
        isValid: true
      }
    });
  }

  /**
   * Get vote count for a specific candidate
   */
  async getCandidateVoteCount(candidateId: string): Promise<number> {
    return this.voteRepo.count({
      where: {
        candidateId,
        isValid: true
      }
    });
  }

  /**
   * Invalidate a vote (admin only, for fraud/dispute resolution)
   */
  async invalidateVote(voteId: string, user: User, reason: string): Promise<Vote> {
    // Authorization check
    if (user.role !== 'admin' && user.role !== 'election_official') {
      throw new Error('Only admins and election officials can invalidate votes');
    }

    const vote = await this.voteRepo.findOne({
      where: { id: voteId }
    });

    if (!vote) {
      throw new Error('Vote not found');
    }

    vote.isValid = false;
    await this.voteRepo.save(vote);

    // TODO: Log this action in audit trail with reason

    return vote;
  }

  /**
   * Get voting statistics for an election
   */
  async getVotingStatistics(electionId: string): Promise<{
    totalVotes: number;
    validVotes: number;
    invalidVotes: number;
    votingStarted: Date;
    votingEnds: Date;
    hoursRemaining: number;
  }> {
    const election = await this.electionRepo.findOne({
      where: { id: electionId }
    });

    if (!election) {
      throw new Error('Election not found');
    }

    const totalVotes = await this.voteRepo.count({
      where: { electionId }
    });

    const validVotes = await this.voteRepo.count({
      where: { electionId, isValid: true }
    });

    const invalidVotes = totalVotes - validVotes;

    const now = new Date();
    const hoursRemaining = Math.max(
      0,
      (election.endDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    );

    return {
      totalVotes,
      validVotes,
      invalidVotes,
      votingStarted: election.startDate,
      votingEnds: election.endDate,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10
    };
  }

  /**
   * Check if user is eligible to vote in an election
   */
  async checkVotingEligibility(userId: string, electionId: string): Promise<{
    eligible: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    // Check voter registration
    const voterReg = await this.voterRegRepo.findOne({
      where: { userId }
    });

    if (!voterReg) {
      reasons.push('User is not registered as a voter');
      return { eligible: false, reasons };
    }

    if (!voterReg.isEligible) {
      reasons.push('User is not eligible to vote');
      return { eligible: false, reasons };
    }

    // Check election status
    const election = await this.electionRepo.findOne({
      where: { id: electionId }
    });

    if (!election) {
      reasons.push('Election not found');
      return { eligible: false, reasons };
    }

    if (election.status !== ElectionStatus.ACTIVE) {
      reasons.push('Election is not currently active');
    }

    const now = new Date();
    if (now < election.startDate) {
      reasons.push('Voting has not started yet');
    }

    if (now > election.endDate) {
      reasons.push('Voting period has ended');
    }

    // Check verification requirements
    if (election.requiresVerification && !voterReg.eligibilityVerifiedAt) {
      reasons.push('Voter eligibility must be verified for this election');
    }

    // Check if already voted
    const hasVoted = await this.hasUserVoted(userId, electionId);
    if (hasVoted) {
      reasons.push('User has already voted in this election');
    }

    return {
      eligible: reasons.length === 0,
      reasons
    };
  }

  /**
   * Generate a secure vote hash for verification
   */
  private generateVoteHash(
    electionId: string,
    voterId: string,
    candidateId: string,
    timestamp: string
  ): string {
    const data = `${electionId}:${voterId}:${candidateId}:${timestamp}`;
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get all votes for a specific election (admin only, for auditing)
   */
  async getAllElectionVotes(electionId: string, user: User): Promise<Vote[]> {
    // Authorization check
    if (user.role !== 'admin' && user.role !== 'election_official') {
      throw new Error('Only admins and election officials can access vote records');
    }

    return this.voteRepo.find({
      where: { electionId },
      relations: ['candidate'],
      order: {
        createdAt: 'ASC'
      }
    });
  }
}
