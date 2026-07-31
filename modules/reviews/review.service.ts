import mongoose from 'mongoose';
import Review from './review.model';
import Product from '../products/product.model';

export interface CreateReviewPayload {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  body?: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  title?: string;
  body?: string;
}

async function recalcProductRating(productId: string): Promise<void> {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg   = stats[0]?.avg   ?? 0;
  const count = stats[0]?.count ?? 0;

  await Product.findByIdAndUpdate(productId, {
    rating:      Math.round(avg * 10) / 10,   // one decimal place
    reviewCount: count,
  });
}

export class ReviewService {
  /** Submit a new review. Throws if the user has already reviewed this product. */
  async createReview(payload: CreateReviewPayload) {
    const review = await Review.create({
      productId: new mongoose.Types.ObjectId(payload.productId),
      userId:    new mongoose.Types.ObjectId(payload.userId),
      userName:  payload.userName,
      rating:    payload.rating,
      title:     payload.title,
      body:      payload.body,
    });
    await recalcProductRating(payload.productId);
    return review;
  }

  /** Update an existing review (by its _id). Only the owner can do this. */
  async updateReview(reviewId: string, userId: string, payload: UpdateReviewPayload) {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId: new mongoose.Types.ObjectId(userId) },
      { $set: payload },
      { new: true, runValidators: true }
    );
    if (!review) return null;
    await recalcProductRating(String(review.productId));
    return review;
  }

  /** Get all reviews for a product, newest first. */
  async getProductReviews(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ productId: new mongoose.Types.ObjectId(productId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ productId: new mongoose.Types.ObjectId(productId) }),
    ]);
    return { reviews, total, page, totalPages: Math.ceil(total / limit) };
  }

  /** Get the review for a specific user + product (null if none). */
  async getUserReview(userId: string, productId: string) {
    return Review.findOne({
      userId:    new mongoose.Types.ObjectId(userId),
      productId: new mongoose.Types.ObjectId(productId),
    }).lean();
  }
}

export const reviewService = new ReviewService();
