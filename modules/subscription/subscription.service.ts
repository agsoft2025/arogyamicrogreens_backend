import mongoose from 'mongoose';
import crypto from 'crypto';
import { RazorpayService } from '../order/razorpay.service';
import SubscriptionModel, {
  ISubscription,
  SubscriptionStatus,
  SubscriptionPaymentStatus,
} from './subscription.model';

export interface PlanDefinition {
  id: string;
  name: string;
  amount: number; // INR
  durationDays: number;
  description: string;
}

export const PLANS: Record<string, PlanDefinition> = {
  weekly: {
    id: 'weekly',
    name: 'Weekly Plan',
    amount: 1599,
    durationDays: 7,
    description: 'Fresh microgreens delivered weekly',
  },
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    amount: 4899,
    durationDays: 30,
    description: 'Fresh microgreens delivered monthly',
  },
  family: {
    id: 'family',
    name: 'Family Pack',
    amount: 8199,
    durationDays: 30,
    description: 'Family-sized microgreens delivered monthly',
  },
};

export interface CreateSubscriptionOrderDto {
  planId: string;
}

export interface VerifySubscriptionPaymentDto {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  planId: string;
}

export class SubscriptionService {
  private razorpayService: RazorpayService;

  constructor() {
    this.razorpayService = new RazorpayService();
  }

  async createSubscriptionOrder(userId: string, dto: CreateSubscriptionOrderDto) {
    const plan = PLANS[dto.planId];
    if (!plan) {
      throw new Error(`Invalid plan: ${dto.planId}`);
    }

    const razorpayOrder = await this.razorpayService.createOrder(
      plan.amount * 100, // paise
      `sub_${userId}_${Date.now()}`,
      { planId: plan.id, planName: plan.name }
    );

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: plan.amount, // INR — frontend multiplies by 100
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || '',
      planId: plan.id,
      planName: plan.name,
      description: plan.description,
      prefill: { name: '', email: '', contact: '' },
    };
  }

  async verifySubscriptionPayment(userId: string, dto: VerifySubscriptionPaymentDto) {
    const plan = PLANS[dto.planId];
    if (!plan) {
      throw new Error(`Invalid plan: ${dto.planId}`);
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new Error('Payment signature verification failed');
    }

    // Deactivate any existing active subscriptions
    await SubscriptionModel.updateMany(
      { userId, subscriptionStatus: SubscriptionStatus.ACTIVE },
      { subscriptionStatus: SubscriptionStatus.INACTIVE }
    );

    // Create new active subscription
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.durationDays);

    const subscription = await SubscriptionModel.create({
      userId,
      planId: plan.id,
      planName: plan.name,
      amount: plan.amount,
      razorpayPaymentId: dto.razorpayPaymentId,
      razorpayOrderId: dto.razorpayOrderId,
      paymentStatus: SubscriptionPaymentStatus.SUCCESS,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      startDate,
      expiryDate,
    });

    return subscription;
  }

  async getMySubscription(userId: string): Promise<ISubscription | null> {
    const subscription = await SubscriptionModel.findOne({
      userId,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    }).sort({ createdAt: -1 });

    if (subscription && new Date() > subscription.expiryDate) {
      subscription.subscriptionStatus = SubscriptionStatus.EXPIRED;
      await subscription.save();
      return null;
    }

    return subscription;
  }

  async isActiveSubscriber(userId: string): Promise<boolean> {
    const subscription = await this.getMySubscription(userId);
    return subscription !== null;
  }

  async getSubscriptionHistory(userId: string): Promise<ISubscription[]> {
    return SubscriptionModel.find({ userId }).sort({ createdAt: -1 });
  }
}
