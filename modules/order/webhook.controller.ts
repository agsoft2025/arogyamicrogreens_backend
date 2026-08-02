import { Request, Response } from 'express';
import { OrderRepository } from './order.repository';
import { RazorpayService } from './razorpay.service';
import { OrderStatus, PaymentStatus, GatewayStatus } from './order.types';

const orderRepo = new OrderRepository();
const razorpayService = new RazorpayService();

export class WebhookController {
  async handleRazorpayWebhook(req: Request, res: Response) {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        return res.status(500).json({
          success: false,
          message: 'Webhook secret not configured',
        });
      }

      const webhookSignature = req.headers['x-razorpay-signature'] as string;
      const webhookBody = JSON.stringify(req.body);

      // Verify webhook signature
      const isValid = razorpayService.verifyWebhookSignature(
        webhookSecret,
        webhookSignature,
        webhookBody
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook signature',
        });
      }

      const event = req.body;
      const eventType = event.event;

      console.log('Razorpay webhook received:', eventType);

      switch (eventType) {
        case 'payment.captured':
          await this.handlePaymentCaptured(event);
          break;

        case 'payment.failed':
          await this.handlePaymentFailed(event);
          break;

        case 'refund.processed':
          await this.handleRefundProcessed(event);
          break;

        case 'order.paid':
          await this.handleOrderPaid(event);
          break;

        default:
          console.log('Unhandled webhook event:', eventType);
      }

      return res.json({
        success: true,
        message: 'Webhook processed successfully',
      });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process webhook',
      });
    }
  }

  private async handlePaymentCaptured(event: any) {
    const { payment, order } = event.payload.payment.entity;

    // Find payment transaction
    const paymentTransaction = await orderRepo.findPaymentTransactionByRazorpayOrderId(
      order.id
    );

    if (!paymentTransaction) {
      console.error('Payment transaction not found for order:', order.id);
      return;
    }

    // Update payment transaction
    await orderRepo.updatePaymentTransaction(paymentTransaction._id.toString(), {
      razorpayPaymentId: payment.id,
      status: GatewayStatus.SUCCESS,
      gatewayResponse: payment,
    });

    // Update order
    const orderDoc = await orderRepo.findById(paymentTransaction.orderId.toString());
    if (orderDoc) {
      await orderRepo.updateById(orderDoc._id.toString(), {
        paymentStatus: PaymentStatus.SUCCESS,
        orderStatus: OrderStatus.CONFIRMED,
      });

      await orderRepo.createStatusHistory({
        orderId: orderDoc._id,
        status: OrderStatus.CONFIRMED,
        remarks: 'Payment captured via webhook',
        changedByRole: 'SYSTEM',
      });
    }
  }

  private async handlePaymentFailed(event: any) {
    const { payment, order } = event.payload.payment.entity;

    // Find payment transaction
    const paymentTransaction = await orderRepo.findPaymentTransactionByRazorpayOrderId(
      order.id
    );

    if (!paymentTransaction) {
      console.error('Payment transaction not found for order:', order.id);
      return;
    }

    // Update payment transaction
    await orderRepo.updatePaymentTransaction(paymentTransaction._id.toString(), {
      razorpayPaymentId: payment.id,
      status: GatewayStatus.FAILED,
      failureReason: payment.error_description || 'Payment failed',
      gatewayResponse: payment,
    });

    // Update order
    const orderDoc = await orderRepo.findById(paymentTransaction.orderId.toString());
    if (orderDoc) {
      await orderRepo.updateById(orderDoc._id.toString(), {
        paymentStatus: PaymentStatus.FAILED,
        orderStatus: OrderStatus.PAYMENT_FAILED,
      });

      await orderRepo.createStatusHistory({
        orderId: orderDoc._id,
        status: OrderStatus.PAYMENT_FAILED,
        remarks: `Payment failed: ${payment.error_description || 'Unknown error'}`,
        changedByRole: 'SYSTEM',
      });
    }
  }

  private async handleRefundProcessed(event: any) {
    const { refund, payment } = event.payload.refund.entity;

    // Find payment transaction by payment id
    const paymentTransaction = await orderRepo.findPaymentTransactionByRazorpayPaymentId(
      payment.id
    );

    if (!paymentTransaction) {
      console.error('Payment transaction not found for payment:', payment.id);
      return;
    }

    // Update payment transaction
    await orderRepo.updatePaymentTransaction(paymentTransaction._id.toString(), {
      status: GatewayStatus.REFUNDED,
      refundId: refund.id,
      refundAmount: refund.amount / 100, // Convert from paise to rupees
      gatewayResponse: refund,
    });

    // Update order
    const orderDoc = await orderRepo.findById(paymentTransaction.orderId.toString());
    if (orderDoc) {
      await orderRepo.updateById(orderDoc._id.toString(), {
        paymentStatus: PaymentStatus.REFUNDED,
        orderStatus: OrderStatus.REFUNDED,
      });

      await orderRepo.createStatusHistory({
        orderId: orderDoc._id,
        status: OrderStatus.REFUNDED,
        remarks: `Refund processed: ${refund.id}`,
        changedByRole: 'SYSTEM',
      });
    }
  }

  private async handleOrderPaid(event: any) {
    const { order } = event.payload.order.entity;

    // Find payment transaction
    const paymentTransaction = await orderRepo.findPaymentTransactionByRazorpayOrderId(
      order.id
    );

    if (!paymentTransaction) {
      console.error('Payment transaction not found for order:', order.id);
      return;
    }

    // Update order if not already confirmed
    const orderDoc = await orderRepo.findById(paymentTransaction.orderId.toString());
    if (orderDoc && orderDoc.orderStatus !== OrderStatus.CONFIRMED) {
      await orderRepo.updateById(orderDoc._id.toString(), {
        paymentStatus: PaymentStatus.SUCCESS,
        orderStatus: OrderStatus.CONFIRMED,
      });

      await orderRepo.createStatusHistory({
        orderId: orderDoc._id,
        status: OrderStatus.CONFIRMED,
        remarks: 'Order paid via webhook',
        changedByRole: 'SYSTEM',
      });
    }
  }
}

export default new WebhookController();
