import { Router } from 'express';
import { requireAdmin } from '../../middlewares/auth.middleware';
import { ProductController } from './product.controller';

const router = Router();
const controller =
  new ProductController();

router.post(
  '/',
  requireAdmin,
  controller.createProduct
);

router.get(
  '/',
  controller.getProducts
);

router.get(
  '/slug/:slug',
  controller.getProductBySlug
);

router.get(
  '/:id',
  controller.getProductById
);

router.patch(
  '/:id',
  requireAdmin,
  controller.updateProduct
);

router.delete(
  '/:id',
  requireAdmin,
  controller.deleteProduct
);

export default router;
