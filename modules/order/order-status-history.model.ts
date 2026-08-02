import mongoose, { Document, Schema } from 'mongoose';
import { OrderStatus } from './order.model';

export interface IOrderStatusHistory extends Document {
  orderId: mongoose.Types.ObjectId;
  status: OrderStatus;
  remarks?: string;
  changedBy?: mongoose.Types.ObjectId;
  changedByRole?: string;
  createdAt: Date;
}

const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
    },
    remarks: {
      type: String,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    changedByRole: {
      type: String,
      enum: ['USER', 'ADMIN', 'SYSTEM'],
      default: 'SYSTEM',
    },
  },
  {
    timestamps: true,
  }
);

OrderStatusHistorySchema.index({ orderId: 1, createdAt: -1 });

export default mongoose.model<IOrderStatusHistory>(
  'OrderStatusHistory',
  OrderStatusHistorySchema
);
