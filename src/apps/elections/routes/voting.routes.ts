import { Router, Request, Response, NextFunction } from 'express';
import { VotingService, CastVoteDto } from '../domain/voting.service.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { authorize } from '../../auth/middleware/authorize.js';
import { UserRole } from '../../../libraries/database/entities/User.js';

const router = Router();
const votingService = new VotingService();

/**
 * @route   POST /api/voting/vote
 * @desc    Cast a vote in an election
 * @access  Private (registered voters)
 */
router.post(
  '/vote',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CastVoteDto = {
        electionId: req.body.electionId,
        candidateId: req.body.candidateId,
        voterId: req.user!.id,
        ipAddress: req.ip || req.socket.remoteAddress
      };

      const receipt = await votingService.castVote(data, req.user!);

      res.status(201).json({
        success: true,
        data: receipt,
        message: 'Vote cast successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/voting/election/:electionId/voted
 * @desc    Check if current user has voted in an election
 * @access  Private
 */
router.get(
  '/election/:electionId/voted',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hasVoted = await votingService.hasUserVoted(req.user!.id, req.params.electionId);

      res.json({
        success: true,
        data: {
          hasVoted,
          electionId: req.params.electionId,
          userId: req.user!.id
        }
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/voting/election/:electionId/receipt
 * @desc    Get vote receipt for current user
 * @access  Private
 */
router.get(
  '/election/:electionId/receipt',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const receipt = await votingService.getVoteReceipt(req.user!.id, req.params.electionId);

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: 'No vote found for this election'
        });
      }

      res.json({
        success: true,
        data: receipt
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/voting/verify
 * @desc    Verify a vote hash
 * @access  Public
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { voteId, voteHash } = req.body;

    if (!voteId || !voteHash) {
      return res.status(400).json({
        success: false,
        message: 'voteId and voteHash are required'
      });
    }

    const isValid = await votingService.verifyVoteHash(voteId, voteHash);

    res.json({
      success: true,
      data: {
        voteId,
        isValid
      }
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/voting/election/:electionId/eligibility
 * @desc    Check voting eligibility for current user
 * @access  Private
 */
router.get(
  '/election/:electionId/eligibility',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eligibility = await votingService.checkVotingEligibility(req.user!.id, req.params.electionId);

      res.json({
        success: true,
        data: eligibility
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/voting/election/:electionId/statistics
 * @desc    Get voting statistics for an election
 * @access  Public
 */
router.get('/election/:electionId/statistics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await votingService.getVotingStatistics(req.params.electionId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/voting/election/:electionId/count
 * @desc    Get total vote count for an election
 * @access  Public
 */
router.get('/election/:electionId/count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await votingService.getElectionVoteCount(req.params.electionId);

    res.json({
      success: true,
      data: {
        electionId: req.params.electionId,
        voteCount: count
      }
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/voting/candidate/:candidateId/count
 * @desc    Get vote count for a specific candidate
 * @access  Public (only for completed elections)
 */
router.get('/candidate/:candidateId/count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await votingService.getCandidateVoteCount(req.params.candidateId);

    res.json({
      success: true,
      data: {
        candidateId: req.params.candidateId,
        voteCount: count
      }
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   POST /api/voting/vote/:voteId/invalidate
 * @desc    Invalidate a vote (admin/election_official only)
 * @access  Private (Admin, Election Official)
 */
router.post(
  '/vote/:voteId/invalidate',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ELECTION_OFFICIAL]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Reason is required for invalidating a vote'
        });
      }

      const vote = await votingService.invalidateVote(req.params.voteId, req.user!, reason);

      res.json({
        success: true,
        data: vote,
        message: 'Vote invalidated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/voting/election/:electionId/votes
 * @desc    Get all votes for an election (admin/election_official only, for auditing)
 * @access  Private (Admin, Election Official)
 */
router.get(
  '/election/:electionId/votes',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ELECTION_OFFICIAL]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const votes = await votingService.getAllElectionVotes(req.params.electionId, req.user!);

      res.json({
        success: true,
        data: votes,
        count: votes.length
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
