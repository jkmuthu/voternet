import { Router, Request, Response, NextFunction } from 'express';
import { CivicFeedService, CreatePostDto, UpdatePostDto, CreateCommentDto, PostFilters } from '../domain/civic-feed.service.js';
import { authenticate } from '../../auth/middleware/authenticate.js';
import { PostType } from '../../../libraries/database/entities/CampaignPost.js';

const router = Router();
const civicFeedService = new CivicFeedService();

/**
 * @route   POST /api/civic/posts
 * @desc    Create a new campaign post
 * @access  Private
 */
router.post(
  '/posts',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreatePostDto = {
        ...req.body,
        authorId: req.user!.id
      };

      const post = await civicFeedService.createPost(data, req.user!);

      res.status(201).json({
        success: true,
        data: post,
        message: 'Post created successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/civic/posts
 * @desc    List posts with filters and pagination
 * @access  Public
 */
router.get('/posts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: PostFilters = {
      postType: req.query.postType as PostType,
      electionId: req.query.electionId as string,
      authorId: req.query.authorId as string,
      isPublished: req.query.isPublished === 'true',
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20
    };

    const result = await civicFeedService.listPosts(filters);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/civic/posts/trending
 * @desc    Get trending posts
 * @access  Public
 */
router.get('/posts/trending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const posts = await civicFeedService.getTrendingPosts(limit);

    res.json({
      success: true,
      data: posts,
      count: posts.length
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/civic/posts/search
 * @desc    Search posts by keyword
 * @access  Public
 */
router.get('/posts/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const keyword = req.query.q as string;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Search keyword (q) is required'
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const posts = await civicFeedService.searchPosts(keyword, limit);

    res.json({
      success: true,
      data: posts,
      count: posts.length,
      keyword
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/civic/posts/:id
 * @desc    Get post by ID
 * @access  Public
 */
router.get('/posts/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await civicFeedService.getPostById(req.params.id);

    res.json({
      success: true,
      data: post
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   PUT /api/civic/posts/:id
 * @desc    Update a post
 * @access  Private (author or admin)
 */
router.put(
  '/posts/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: UpdatePostDto = req.body;
      const post = await civicFeedService.updatePost(req.params.id, data, req.user!);

      res.json({
        success: true,
        data: post,
        message: 'Post updated successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/civic/posts/:id
 * @desc    Delete a post
 * @access  Private (author or admin)
 */
router.delete(
  '/posts/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await civicFeedService.deletePost(req.params.id, req.user!);

      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/civic/posts/:id/like
 * @desc    Like a post
 * @access  Private
 */
router.post(
  '/posts/:id/like',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await civicFeedService.likePost(req.params.id, req.user!.id);

      res.json({
        success: true,
        data: post,
        message: 'Post liked'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/civic/posts/:id/share
 * @desc    Share a post
 * @access  Private
 */
router.post(
  '/posts/:id/share',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const post = await civicFeedService.sharePost(req.params.id, req.user!.id);

      res.json({
        success: true,
        data: post,
        message: 'Post shared'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/civic/posts/user/:userId
 * @desc    Get posts by user
 * @access  Public
 */
router.get('/posts/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const posts = await civicFeedService.getUserPosts(req.params.userId);

    res.json({
      success: true,
      data: posts,
      count: posts.length
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   POST /api/civic/comments
 * @desc    Create a comment on a post
 * @access  Private
 */
router.post(
  '/comments',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateCommentDto = {
        ...req.body,
        authorId: req.user!.id
      };

      const comment = await civicFeedService.createComment(data, req.user!);

      res.status(201).json({
        success: true,
        data: comment,
        message: 'Comment created successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/civic/posts/:postId/comments
 * @desc    Get comments for a post
 * @access  Public
 */
router.get('/posts/:postId/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await civicFeedService.getPostComments(req.params.postId);

    res.json({
      success: true,
      data: comments,
      count: comments.length
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   GET /api/civic/comments/:commentId/replies
 * @desc    Get replies to a comment
 * @access  Public
 */
router.get('/comments/:commentId/replies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const replies = await civicFeedService.getCommentReplies(req.params.commentId);

    res.json({
      success: true,
      data: replies,
      count: replies.length
    });
  } catch (error: any) {
    next(error);
  }
});

/**
 * @route   DELETE /api/civic/comments/:id
 * @desc    Delete a comment
 * @access  Private (author or admin)
 */
router.delete(
  '/comments/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await civicFeedService.deleteComment(req.params.id, req.user!);

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/civic/comments/:id/like
 * @desc    Like a comment
 * @access  Private
 */
router.post(
  '/comments/:id/like',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const comment = await civicFeedService.likeComment(req.params.id, req.user!.id);

      res.json({
        success: true,
        data: comment,
        message: 'Comment liked'
      });
    } catch (error: any) {
      next(error);
    }
  }
);

export default router;
