import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import {
  getProductReviews,
  getMyReview,
  createReview,
  updateReview,
} from './review.controller';

const router = Router();

router.get('/',    getProductReviews);          // public
router.get('/my',  requireAuth, getMyReview);   // auth
router.post('/',   requireAuth, createReview);  // auth
router.put('/:id', requireAuth, updateReview);  // auth, own review

export default router;
