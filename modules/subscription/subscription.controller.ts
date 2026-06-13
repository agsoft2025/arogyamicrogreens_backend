import { Request, Response } from 'express';
import { SubscriptionService } from './subscription.service';

const subscriptionService = new SubscriptionService();

export class SubscriptionController {
  async createOrder(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ success: false, message: 'planId is required.' });
      }
      const data = await subscriptionService.createSubscriptionOrder(userId, { planId });
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error('[SubscriptionController.createOrder]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async verifyPayment(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const dto = req.body;
      const data = await subscriptionService.verifySubscriptionPayment(userId, dto);
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error('[SubscriptionController.verifyPayment]', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMySubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const data = await subscriptionService.getMySubscription(userId);
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error('[SubscriptionController.getMySubscription]', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const isActive = await subscriptionService.isActiveSubscriber(userId);
      return res.json({ success: true, data: { isActive } });
    } catch (error: any) {
      console.error('[SubscriptionController.getStatus]', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id || (req as any).user?._id;
      const data = await subscriptionService.getSubscriptionHistory(userId);
      return res.json({ success: true, data });
    } catch (error: any) {
      console.error('[SubscriptionController.getHistory]', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new SubscriptionController();
