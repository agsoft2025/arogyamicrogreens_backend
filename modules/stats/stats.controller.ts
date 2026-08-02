import { Request, Response } from 'express';
import User from '../users/user.model';
import Product from '../products/product.model';

/**
 * GET /stats  (public)
 * Returns live aggregate numbers used on the login screen.
 *
 * avgRating is computed from the Product collection's rating field so that
 * manually-set admin ratings are reflected even before any user reviews exist.
 */
export async function getPublicStats(req: Request, res: Response) {
  try {
    const [customerCount, varietyCount, ratingStats] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      // Average over active products that have a rating set (> 0)
      Product.aggregate([
        { $match: { status: 'active', rating: { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const avgRating: number =
      ratingStats.length > 0
        ? Math.round(ratingStats[0].avg * 10) / 10
        : 0;

    return res.json({
      success: true,
      data: {
        customerCount,
        varietyCount,
        avgRating,
        reviewCount: ratingStats[0]?.count ?? 0,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
}
