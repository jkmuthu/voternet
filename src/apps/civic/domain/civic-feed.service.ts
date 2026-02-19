import { Repository } from 'typeorm';
import { AppDataSource } from '../../../libraries/database/data-source.js';
import { CampaignPost, PostType } from '../../../libraries/database/entities/CampaignPost.js';
import { Comment } from '../../../libraries/database/entities/Comment.js';
import { User } from '../../../libraries/database/entities/User.js';
import { Election } from '../../../libraries/database/entities/Election.js';

export interface CreatePostDto {
  title: string;
  content: string;
  postType: PostType;
  electionId?: string;
  authorId: string;
  tags?: string[];
  imageUrl?: string;
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  postType?: PostType;
  tags?: string[];
  imageUrl?: string;
  isPublished?: boolean;
}

export interface CreateCommentDto {
  content: string;
  postId: string;
  authorId: string;
  parentCommentId?: string;
}

export interface PostFilters {
  postType?: PostType;
  electionId?: string;
  authorId?: string;
  isPublished?: boolean;
  tags?: string[];
  page?: number;
  limit?: number;
}

export class CivicFeedService {
  private postRepo: Repository<CampaignPost>;
  private commentRepo: Repository<Comment>;
  private electionRepo: Repository<Election>;

  constructor() {
    this.postRepo = AppDataSource.getRepository(CampaignPost);
    this.commentRepo = AppDataSource.getRepository(Comment);
    this.electionRepo = AppDataSource.getRepository(Election);
  }

  /**
   * Create a new campaign post
   */
  async createPost(data: CreatePostDto, user: User): Promise<CampaignPost> {
    // Verify election exists if specified
    if (data.electionId) {
      const election = await this.electionRepo.findOne({
        where: { id: data.electionId }
      });

      if (!election) {
        throw new Error('Election not found');
      }
    }

    const post = this.postRepo.create({
      title: data.title,
      content: data.content,
      postType: data.postType,
      authorId: data.authorId,
      electionId: data.electionId,
      tags: data.tags || [],
      imageUrl: data.imageUrl,
      isPublished: true,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0
    });

    await this.postRepo.save(post);
    return post;
  }

  /**
   * List posts with filters and pagination
   */
  async listPosts(filters?: PostFilters): Promise<{ posts: CampaignPost[]; total: number; page: number; totalPages: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const query = this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.election', 'election')
      .orderBy('post.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters?.postType) {
      query.andWhere('post.postType = :postType', { postType: filters.postType });
    }

    if (filters?.electionId) {
      query.andWhere('post.electionId = :electionId', { electionId: filters.electionId });
    }

    if (filters?.authorId) {
      query.andWhere('post.authorId = :authorId', { authorId: filters.authorId });
    }

    if (filters?.isPublished !== undefined) {
      query.andWhere('post.isPublished = :isPublished', { isPublished: filters.isPublished });
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.andWhere('post.tags && :tags', { tags: filters.tags });
    }

    const [posts, total] = await query.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      posts,
      total,
      page,
      totalPages
    };
  }

  /**
   * Get post by ID with details
   */
  async getPostById(postId: string): Promise<CampaignPost> {
    const post = await this.postRepo.findOne({
      where: { id: postId },
      relations: ['author', 'election']
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return post;
  }

  /**
   * Update post
   */
  async updatePost(postId: string, data: UpdatePostDto, user: User): Promise<CampaignPost> {
    const post = await this.getPostById(postId);

    // Only author or admin can update
    if (post.authorId !== user.id && user.role !== 'admin') {
      throw new Error('Not authorized to update this post');
    }

    if (data.title) post.title = data.title;
    if (data.content) post.content = data.content;
    if (data.postType) post.postType = data.postType;
    if (data.tags) post.tags = data.tags;
    if (data.imageUrl !== undefined) post.imageUrl = data.imageUrl;
    if (data.isPublished !== undefined) post.isPublished = data.isPublished;

    await this.postRepo.save(post);
    return post;
  }

  /**
   * Delete post (mark as unpublished)
   */
  async deletePost(postId: string, user: User): Promise<void> {
    const post = await this.getPostById(postId);

    // Only author or admin can delete
    if (post.authorId !== user.id && user.role !== 'admin') {
      throw new Error('Not authorized to delete this post');
    }

    post.isPublished = false;
    await this.postRepo.save(post);
  }

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string): Promise<CampaignPost> {
    const post = await this.getPostById(postId);

    // TODO: Track individual likes in a separate table to prevent double-liking
    // For now, just increment the counter
    post.likesCount += 1;
    await this.postRepo.save(post);

    return post;
  }

  /**
   * Share a post
   */
  async sharePost(postId: string, userId: string): Promise<CampaignPost> {
    const post = await this.getPostById(postId);

    post.sharesCount += 1;
    await this.postRepo.save(post);

    return post;
  }

  /**
   * Create a comment on a post
   */
  async createComment(data: CreateCommentDto, user: User): Promise<Comment> {
    // Verify post exists
    const post = await this.getPostById(data.postId);

    // Verify parent comment exists if specified
    if (data.parentCommentId) {
      const parentComment = await this.commentRepo.findOne({
        where: { id: data.parentCommentId }
      });

      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      if (parentComment.postId !== data.postId) {
        throw new Error('Parent comment is not from the same post');
      }
    }

    const comment = this.commentRepo.create({
      content: data.content,
      postId: data.postId,
      authorId: data.authorId,
      parentCommentId: data.parentCommentId,
      likesCount: 0,
      isVisible: true
    });

    await this.commentRepo.save(comment);

    // Update post comment count
    post.commentsCount += 1;
    await this.postRepo.save(post);

    return comment;
  }

  /**
   * Get comments for a post
   */
  async getPostComments(postId: string): Promise<Comment[]> {
    return this.commentRepo.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.postId = :postId', { postId })
      .andWhere('comment.isVisible = :isVisible', { isVisible: true })
      .andWhere('comment.parentCommentId IS NULL')
      .orderBy('comment.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Get replies to a comment
   */
  async getCommentReplies(commentId: string): Promise<Comment[]> {
    return this.commentRepo.find({
      where: {
        parentCommentId: commentId,
        isVisible: true
      },
      relations: ['author'],
      order: {
        createdAt: 'ASC'
      }
    });
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, user: User): Promise<void> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Only author or admin can delete
    if (comment.authorId !== user.id && user.role !== 'admin') {
      throw new Error('Not authorized to delete this comment');
    }

    comment.isVisible = false;
    await this.commentRepo.save(comment);

    // Update post comment count
    const post = await this.getPostById(comment.postId);
    post.commentsCount = Math.max(0, post.commentsCount - 1);
    await this.postRepo.save(post);
  }

  /**
   * Like a comment
   */
  async likeComment(commentId: string, userId: string): Promise<Comment> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // TODO: Track individual likes to prevent double-liking
    comment.likesCount += 1;
    await this.commentRepo.save(comment);

    return comment;
  }

  /**
   * Get trending posts (by engagement)
   */
  async getTrendingPosts(limit = 10): Promise<CampaignPost[]> {
    // Calculate engagement score: likes + (comments * 2) + (shares * 3)
    return this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.election', 'election')
      .where('post.isPublished = :isPublished', { isPublished: true })
      .andWhere('post.createdAt > :weekAgo', { 
        weekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
      })
      .orderBy('(post.likesCount + post.commentsCount * 2 + post.sharesCount * 3)', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Get posts by user
   */
  async getUserPosts(userId: string): Promise<CampaignPost[]> {
    return this.postRepo.find({
      where: {
        authorId: userId,
        isPublished: true
      },
      relations: ['election'],
      order: {
        createdAt: 'DESC'
      }
    });
  }

  /**
   * Search posts by keyword
   */
  async searchPosts(keyword: string, limit = 20): Promise<CampaignPost[]> {
    return this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.election', 'election')
      .where('post.isPublished = :isPublished', { isPublished: true })
      .andWhere('(post.title ILIKE :keyword OR post.content ILIKE :keyword)', {
        keyword: `%${keyword}%`
      })
      .orderBy('post.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }
}
