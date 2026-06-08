import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { CartController } from './cart.controller';

const router = Router();
const controller = new CartController();

router.get(
  '/',
  requireAuth,
  controller.getCart
);

router.post(
  '/',
  requireAuth,
  controller.addToCart
);

router.put(
  '/items/:productId',
  requireAuth,
  controller.updateCartItem
);

router.delete(
  '/items/:productId',
  requireAuth,
  controller.removeFromCart
);

router.delete(
  '/',
  requireAuth,
  controller.clearCart
);

export default router;
