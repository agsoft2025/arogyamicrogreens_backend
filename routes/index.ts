import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import productRoutes from '../modules/products/product.routes';
import uploadRoutes from '../modules/uploads/upload.routes';

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

export default router;
