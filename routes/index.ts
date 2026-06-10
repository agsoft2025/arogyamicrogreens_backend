import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import productRoutes from '../modules/products/product.routes';
import uploadRoutes from '../modules/uploads/upload.routes';
import userRoutes from '../modules/users/user.routes';
import cartRoutes from '../modules/cart/cart.routes';
import orderRoutes from '../modules/order/order.routes';
import webhookRoutes from '../modules/order/webhook.routes';

const router = Router();

router.use(
  '/auth',
  authRoutes
);

router.use(
  '/products',
  productRoutes
);

router.use(
  '/uploads',
  uploadRoutes
);

router.use(
  '/users',
  userRoutes
);

router.use(
  '/cart',
  cartRoutes
);

router.use(
  '/orders',
  orderRoutes
);

router.use(
  '/webhooks',
  webhookRoutes
);

export default router;
