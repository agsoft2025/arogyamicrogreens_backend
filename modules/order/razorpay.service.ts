import Razorpay from 'razorpay';
import crypto from 'crypto';

export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || '',
      key_secret: process.env.RAZORPAY_KEY_SECRET || '',
    });
  }

  async createOrder(amount: number, receipt: string, notes: any = {}) {
    try {
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        receipt,
        notes,
        payment_capture: 1, // Auto capture payment
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error: any) {
      throw new Error(`Razorpay order creation failed: ${error.message}`);
    }
  }

  verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    try {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      return generatedSignature === razorpaySignature;
    } catch (error: any) {
      throw new Error(`Signature verification failed: ${error.message}`);
    }
  }

  verifyWebhookSignature(
    webhookSecret: string,
    webhookSignature: string,
    webhookBody: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(webhookBody)
        .digest('hex');

      return expectedSignature === webhookSignature;
    } catch (error: any) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  async fetchPayment(paymentId: string) {
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error: any) {
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  async fetchOrder(orderId: string) {
    try {
      return await this.razorpay.orders.fetch(orderId);
    } catch (error: any) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  async refundPayment(paymentId: string, amount: number, notes: any = {}) {
    try {
      const options = {
        amount: amount * 100, // Amount in paise
        notes,
      };

      const refund = await this.razorpay.payments.refund(paymentId, options);
      return refund;
    } catch (error: any) {
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  getKey(): string {
    return process.env.RAZORPAY_KEY_ID || '';
  }
}
