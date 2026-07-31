import { Request, Response } from 'express';
import { reviewService } from './review.service';
import { AuthRequest } from '../../middlewares/auth.middleware';
import User from '../users/user.model';

/** GET /reviews?productId=xxx&page=1&limit=10  (public) */
export async function getProductReviews(req: Request, res: Response) {
  try {
    const { productId, page = '1', limit = '10' } = req.query as Record<string, string>;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    const data = await reviewService.getProductReviews(
      productId,
      Number(page),
      Math.min(Number(limit), 50)
    );
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
}

/** GET /reviews/my?productId=xxx  (auth required) */
export async function getMyReview(req: AuthRequest, res: Response) {
  try {
    const { productId } = req.query as Record<string, string>;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    const review = await reviewService.getUserReview(req.userId!, productId);
    return res.json({ success: true, data: review ?? null });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch review' });
  }
}

/** POST /reviews  (auth required) */
export async function createReview(req: AuthRequest, res: Response) {
  try {
    const { productId, rating, title, body } = req.body as {
      productId?: string;
      rating?: number;
      title?: string;
      body?: string;
    };

    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
    }

    // Fetch user name for display
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const review = await reviewService.createReview({
      productId,
      userId:   req.userId!,
      userName: user.name,
      rating:   Number(rating),
      title:    title?.trim(),
      body:     body?.trim(),
    });

    return res.status(201).json({ success: true, data: review, message: 'Review submitted' });
  } catch (err: unknown) {
    // Duplicate key → user already reviewed this product
    if ((err as { code?: number })?.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product' });
    }
    return res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
}

/** PUT /reviews/:id  (auth required, own reviews only) */
export async function updateReview(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    const { rating, title, body } = req.body as {
      rating?: number;
      title?: string;
      body?: string;
    };

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'rating must be between 1 and 5' });
    }

    const review = await reviewService.updateReview(id, req.userId!, {
      ...(rating !== undefined && { rating: Number(rating) }),
      ...(title  !== undefined && { title:  title.trim() }),
      ...(body   !== undefined && { body:   body.trim()  }),
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found or not yours' });
    }
    return res.json({ success: true, data: review, message: 'Review updated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update review' });
  }
}
