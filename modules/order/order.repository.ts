import Order, { IOrder } from './order.model';
import PaymentTransaction, { IPaymentTransaction } from './payment-transaction.model';
import OrderStatusHistory, { IOrderStatusHistory } from './order-status-history.model';

export class OrderRepository {
  async findByOrderNumber(orderNumber: string) {
    return Order.findOne({ orderNumber }).populate('items.productId');
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return Order.find({ userId })
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  async findById(id: string) {
    return Order.findById(id).populate('items.productId');
  }

  async create(data: Partial<IOrder>) {
    return Order.create(data);
  }

  async updateById(id: string, data: Partial<IOrder>) {
    return Order.findByIdAndUpdate(
      id,
      data,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    ).populate('items.productId');
  }

  async updateOrderStatus(id: string, status: string) {
    return Order.findByIdAndUpdate(
      id,
      { orderStatus: status },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    ).populate('items.productId');
  }

  async updatePaymentStatus(id: string, paymentStatus: string) {
    return Order.findByIdAndUpdate(
      id,
      { paymentStatus },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    ).populate('items.productId');
  }

  async deleteById(id: string) {
    return Order.findByIdAndDelete(id);
  }

  async countByUserId(userId: string) {
    return Order.countDocuments({ userId });
  }

  // Payment Transaction Methods
  async createPaymentTransaction(data: Partial<IPaymentTransaction>) {
    return PaymentTransaction.create(data);
  }

  async findPaymentTransactionByOrderId(orderId: string) {
    return PaymentTransaction.findOne({ orderId });
  }

  async findPaymentTransactionByRazorpayOrderId(razorpayOrderId: string) {
    return PaymentTransaction.findOne({ razorpayOrderId });
  }

  async findPaymentTransactionByRazorpayPaymentId(razorpayPaymentId: string) {
    return PaymentTransaction.findOne({ razorpayPaymentId });
  }

  async updatePaymentTransaction(id: string, data: Partial<IPaymentTransaction>) {
    return PaymentTransaction.findByIdAndUpdate(
      id,
      data,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );
  }

  // Order Status History Methods
  async createStatusHistory(data: Partial<IOrderStatusHistory>) {
    return OrderStatusHistory.create(data);
  }

  async findStatusHistoryByOrderId(orderId: string) {
    return OrderStatusHistory.find({ orderId }).sort({ createdAt: -1 });
  }

  // Transaction support methods
  async findByIdForUpdate(id: string) {
    return Order.findById(id).session(null);
  }

  async updateWithTransaction(id: string, data: Partial<IOrder>, session: any) {
    return Order.findByIdAndUpdate(
      id,
      data,
      {
        returnDocument: 'after',
        runValidators: true,
        session,
      }
    ).populate('items.productId');
  }
}
