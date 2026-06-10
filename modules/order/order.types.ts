import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  IShippingAddress,
  IBillingAddress,
} from './order.model';
import { GatewayStatus } from './payment-transaction.model';

export { OrderStatus, PaymentStatus, PaymentMethod, GatewayStatus };

export interface PreviewOrderDto {
  couponCode?: string;
}

export interface CreatePaymentOrderDto {
  paymentMethod: PaymentMethod;
  shippingAddress: IShippingAddress;
  billingAddress: IBillingAddress;
  couponCode?: string;
  notes?: string;
}

export interface CreateCodOrderDto {
  shippingAddress: IShippingAddress;
  billingAddress: IBillingAddress;
  couponCode?: string;
  notes?: string;
}

export interface VerifyPaymentDto {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  remarks?: string;
}

export interface RefundOrderDto {
  amount: number;
  reason: string;
}

export interface OrderPreviewResponse {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  couponCode?: string;
  couponDiscount?: number;
}

export interface CreatePaymentOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  orderName: string;
  description: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: {
    orderId: string;
  };
}

export interface OrderResponse {
  orderNumber: string;
  userId: string;
  items: any[];
  subtotal: number;
  discount: number;
  shippingCharge: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddress: IShippingAddress;
  billingAddress: IBillingAddress;
  couponCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  paymentTransaction?: any;
  statusHistory?: any[];
}

export class OrderError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'OrderError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
