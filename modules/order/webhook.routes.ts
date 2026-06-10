import { Router } from 'express';
import webhookController from './webhook.controller';

const router = Router();

// Razorpay webhook endpoint (no auth required - verified via signature)
router.post('/razorpay', webhookController.handleRazorpayWebhook.bind(webhookController));

export default router;
