import { Router, Request, Response, NextFunction } from 'express';
import { ElectionService, CreateElectionDto, UpdateElectionDto, ElectionFilters } from '../domain/election.service.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { authorize } from '../../auth/middleware/authorize.js';
import { UserRole } from '../../../libraries/database/entities/User.js';
import { ElectionType, ElectionStatus } from '../../../libraries/database/entities/Election.js';

const router = Router();
const electionService = new ElectionService();

/**
 * @route   POST /api/elections
 * @desc    Create a new election (admin/election_official only)
 * @access  Private (Admin, Election Official)
 */
router.post(
  '/',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ELECTION_OFFICIAL]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateElectionDto = {
        ...req.body,
        createdByUserId: req.user!.id
      };

      const election = await electionService.createElection(data, req.user!);

      res.status(201).json({
        success: true,
        data: election,
        message: 'Election created successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/elections
 * @desc    List all elections with optional filters
 * @access  Public
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: ElectionFilters = {
      status: req.query.status as ElectionStatus,
      electionType: req.query.electionType as ElectionType,
      jurisdiction: req.query.jurisdiction as string,
      startDateFrom: req.query.startDateFrom ? new Date(req.query.startDateFrom as string) : undefined,
      startDateTo: req.query.startDateTo ? new Date(req.query.startDateTo as string) : undefined
    };

    const elections = await electionService.listElections(filters);

    res.json({
      success: true,
      data: elections,
      count: elections.length
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/elections/active
 * @desc    Get currently active elections
 * @access  Public
 */
router.get('/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const elections = await electionService.getActiveElections();

    res.json({
      success: true,
      data: elections,
      count: elections.length
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/elections/upcoming
 * @desc    Get upcoming elections
 * @access  Public
 */
router.get('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const elections = await electionService.getUpcomingElections();

    res.json({
      success: true,
      data: elections,
      count: elections.length
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/elections/:id
 * @desc    Get election by ID
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const election = await electionService.getElectionById(req.params.id);

    res.json({
      success: true,
      data: election
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   PUT /api/elections/:id
 * @desc    Update election details
 * @access  Private (Admin, Election Official)
 */
router.put(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ELECTION_OFFICIAL]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: UpdateElectionDto = req.body;
      const election = await electionService.updateElection(req.params.id, data, req.user!);

      res.json({
        success: true,
        data: election,
        message: 'Election updated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/elections/:id/publish
 * @desc    Publish an election
 * @access  Private (Admin, Election Official)
 */
router.post(
  '/:id/publish',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ELECTION_OFFICIAL]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const election = await electionService.publishElection(req.params.id, req.user!);

      res.json({
        success: true,
        data: election,
        message: 'Election published successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/elections/:id/activate
 * @desc    Activate an election (voting begins)
 * @access  Private (Admin, Election Official)
 */
router.post(
  '/:id/activate',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ELECTION_OFFICIAL]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const election = await electionService.activateElection(req.params.id, req.user!);

      res.json({
        success: true,
        data: election,
        message: 'Election activated - voting has begun'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/elections/:id/complete
 * @desc    Complete an election (voting ends)
 * @access  Private (Admin, Election Official)
 */
router.post(
  '/:id/complete',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ELECTION_OFFICIAL]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const election = await electionService.completeElection(req.params.id, req.user!);

      res.json({
        success: true,
        data: election,
        message: 'Election completed - voting has ended'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/elections/:id/cancel
 * @desc    Cancel an election
 * @access  Private (Admin, Election Official)
 */
router.post(
  '/:id/cancel',
  authenticate,
  authorize([UserRole.ADMIN, UserRole.ELECTION_OFFICIAL]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const election = await electionService.cancelElection(req.params.id, req.user!);

      res.json({
        success: true,
        data: election,
        message: 'Election cancelled'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/elections/:id/results
 * @desc    Get election results
 * @access  Public (only for completed elections)
 */
router.get('/:id/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await electionService.getElectionResults(req.params.id);

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/elections/:id/status
 * @desc    Check if election is active for voting
 * @access  Public
 */
router.get('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isActive = await electionService.isElectionActiveForVoting(req.params.id);

    res.json({
      success: true,
      data: {
        electionId: req.params.id,
        isActiveForVoting: isActive
      }
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
