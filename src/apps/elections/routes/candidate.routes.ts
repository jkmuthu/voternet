import { Router, Request, Response, NextFunction } from 'express';
import { CandidateService, RegisterCandidateDto, UpdateCandidateDto } from '../domain/candidate.service.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { authorize } from '../../auth/middleware/authorize.js';
import { UserRole } from '../../../libraries/database/entities/User.js';

const router = Router();
const candidateService = new CandidateService();

/**
 * @route   POST /api/candidates
 * @desc    Register as a candidate
 * @access  Private (registered voters)
 */
router.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: RegisterCandidateDto = {
        ...req.body,
        userId: req.user!.id
      };

      const candidate = await candidateService.registerCandidate(data, req.user!);

      res.status(201).json({
        success: true,
        data: candidate,
        message: 'Candidate registration successful'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/candidates/election/:electionId
 * @desc    List all candidates for an election
 * @access  Public
 */
router.get('/election/:electionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const candidates = await candidateService.listCandidates(req.params.electionId, includeInactive);

    res.json({
      success: true,
      data: candidates,
      count: candidates.length
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/candidates/:id
 * @desc    Get candidate details
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidate = await candidateService.getCandidateById(req.params.id);

    res.json({
      success: true,
      data: candidate
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   PUT /api/candidates/:id
 * @desc    Update candidate profile
 * @access  Private (candidate themselves or admin)
 */
router.put(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: UpdateCandidateDto = req.body;
      const candidate = await candidateService.updateCandidate(req.params.id, data, req.user!);

      res.json({
        success: true,
        data: candidate,
        message: 'Candidate profile updated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/candidates/:id/verify
 * @desc    Verify a candidate
 * @access  Private (Admin, Election Official)
 */
router.post(
  '/:id/verify',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ELECTION_OFFICIAL]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidate = await candidateService.verifyCandidate(req.params.id, req.user!);

      res.json({
        success: true,
        data: candidate,
        message: 'Candidate verified successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/candidates/:id/deactivate
 * @desc    Deactivate/withdraw candidate
 * @access  Private (candidate themselves or admin)
 */
router.post(
  '/:id/deactivate',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidate = await candidateService.deactivateCandidate(req.params.id, req.user!);

      res.json({
        success: true,
        data: candidate,
        message: 'Candidate deactivated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/candidates/:id/reactivate
 * @desc    Reactivate a candidate
 * @access  Private (Admin only)
 */
router.post(
  '/:id/reactivate',
  authenticate,
  authorize([UserRole.ADMIN]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidate = await candidateService.reactivateCandidate(req.params.id, req.user!);

      res.json({
        success: true,
        data: candidate,
        message: 'Candidate reactivated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/candidates/user/:userId/election/:electionId
 * @desc    Check if user is a candidate in an election
 * @access  Public
 */
router.get('/user/:userId/election/:electionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isCandidate = await candidateService.isUserCandidate(req.params.userId, req.params.electionId);
    const candidate = await candidateService.getCandidateByUserAndElection(req.params.userId, req.params.electionId);

    res.json({
      success: true,
      data: {
        isCandidate,
        candidate
      }
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/candidates/user/:userId/candidacies
 * @desc    Get all elections where user is a candidate
 * @access  Public
 */
router.get('/user/:userId/candidacies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const candidacies = await candidateService.getUserCandidacies(req.params.userId);

    res.json({
      success: true,
      data: candidacies,
      count: candidacies.length
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
