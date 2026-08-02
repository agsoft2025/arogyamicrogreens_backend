import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import subscriptionController from './subscription.controller';

const router = Router();

router.post('/create-order', requireAuth, subscriptionController.createOrder.bind(subscriptionController));
router.post('/verify-payment', requireAuth, subscriptionController.verifyPayment.bind(subscriptionController));
router.get('/my-subscription', requireAuth, subscriptionController.getMySubscription.bind(subscriptionController));
router.get('/status', requireAuth, subscriptionController.getStatus.bind(subscriptionController));
router.get('/history', requireAuth, subscriptionController.getHistory.bind(subscriptionController));

export default router;
