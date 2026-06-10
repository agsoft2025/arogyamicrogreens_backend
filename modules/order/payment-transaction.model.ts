import mongoose, { Document, Schema } from 'mongoose';
import { PaymentStatus, PaymentMethod } from './order.model';

export enum GatewayStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  REFUNDED = 'REFUNDED',
}

export interface IPaymentTransaction extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  paymentGateway: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: GatewayStatus;
  paymentMethod: PaymentMethod;
  gatewayResponse?: any;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    paymentGateway: {
      type: String,
      required: true,
      default: 'RAZORPAY',
    },
    razorpayOrderId: {
      type: String,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      index: true,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    status: {
      type: String,
      enum: Object.values(GatewayStatus),
      required: true,
      default: GatewayStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
    },
    failureReason: {
      type: String,
    },
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

PaymentTransactionSchema.index({ razorpayOrderId: 1 });
PaymentTransactionSchema.index({ razorpayPaymentId: 1 });
PaymentTransactionSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IPaymentTransaction>(
  'PaymentTransaction',
  PaymentTransactionSchema
);
