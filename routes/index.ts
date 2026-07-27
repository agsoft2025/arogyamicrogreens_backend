import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import productRoutes from '../modules/products/product.routes';
import uploadRoutes from '../modules/uploads/upload.routes';
import userRoutes from '../modules/users/user.routes';
import cartRoutes from '../modules/cart/cart.routes';
import orderRoutes from '../modules/order/order.routes';
import webhookRoutes from '../modules/order/webhook.routes';
import subscriptionRoutes from '../modules/subscription/subscription.routes';
import subscriptionPlanRoutes from '../modules/subscription-plans/subscription-plan.routes';
import contactRoutes from '../modules/contact/contact.routes';
import testEmailRoutes from '../modules/test-email/test-email.routes';
import reviewSettingsRoutes from '../modules/review-settings/review-settings.routes';
import reviewRoutes from '../modules/reviews/review.routes';
import statsRoutes from '../modules/stats/stats.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/uploads', uploadRoutes);
router.use('/users', userRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/subscription-plans', subscriptionPlanRoutes);
router.use('/contact', contactRoutes);
router.use('/test-email', testEmailRoutes);
router.use('/review-settings', reviewSettingsRoutes);
router.use('/reviews', reviewRoutes);
router.use('/stats', statsRoutes);

export default router;
