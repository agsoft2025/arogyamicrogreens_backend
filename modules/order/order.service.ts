import mongoose from 'mongoose';
import { OrderRepository } from './order.repository';
import { RazorpayService } from './razorpay.service';
import { CartRepository } from '../cart/cart.repository';
import Product from '../products/product.model';
import {
  OrderError,
  PreviewOrderDto,
  CreatePaymentOrderDto,
  CreateCodOrderDto,
  VerifyPaymentDto,
  OrderPreviewResponse,
  CreatePaymentOrderResponse,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  GatewayStatus,
} from './order.types';
import orderModel from './order.model';

export class OrderService {
  private orderRepo: OrderRepository;
  private razorpayService: RazorpayService;
  private cartRepo: CartRepository;

  constructor() {
    this.orderRepo = new OrderRepository();
    this.razorpayService = new RazorpayService();
    this.cartRepo = new CartRepository();
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `ORD${timestamp}${random}`;
  }

  private calculateTax(amount: number): number {
    // 18% GST (example rate)
    return Math.round(amount * 0.18);
  }

  private calculateShipping(amount: number): number {
    // Free shipping for orders above 1000, otherwise 100
    return amount >= 1000 ? 0 : 100;
  }

  async getAllOrders(query: any) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter: any = {};

  // Search by Order Number
  if (query.search?.trim()) {
    filter.orderNumber = {
      $regex: query.search.trim(),
      $options: 'i',
    };
  }

  // Order Status Filter
  if (
    query.orderStatus &&
    Object.values(OrderStatus).includes(
      query.orderStatus
    )
  ) {
    filter.orderStatus =
      query.orderStatus;
  }

  // Payment Status Filter
  if (
    query.paymentStatus &&
    Object.values(
      PaymentStatus
    ).includes(query.paymentStatus)
  ) {
    filter.paymentStatus =
      query.paymentStatus;
  }

  // Payment Method Filter
  if (
    query.paymentMethod &&
    Object.values(
      PaymentMethod
    ).includes(query.paymentMethod)
  ) {
    filter.paymentMethod =
      query.paymentMethod;
  }

  // Date Range
  if (
    query.startDate ||
    query.endDate
  ) {
    filter.createdAt = {};

    if (query.startDate) {
      filter.createdAt.$gte = new Date(
        query.startDate
      );
    }

    if (query.endDate) {
      filter.createdAt.$lte = new Date(
        query.endDate
      );
    }
  }

  // Sorting
  const sort: any = {};

  if (query.sort === 'oldest') {
    sort.createdAt = 1;
  } else {
    sort.createdAt = -1;
  }

  const [orders, total] =
    await Promise.all([
      orderModel.find(filter)
        .populate(
          'userId',
          'name mobileNumber email'
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      orderModel.countDocuments(filter),
    ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(
        total / limit
      ),
      hasNext:
        page <
        Math.ceil(total / limit),
      hasPrevious: page > 1,
    },
  };
}

  async previewOrder(userId: string, dto: PreviewOrderDto): Promise<OrderPreviewResponse> {
    const cart = await this.cartRepo.findByUserId(userId, 'active');
    if (!cart || cart.items.length === 0) {
      throw new OrderError('Cart is empty', 400);
    }

    // Validate all products
    const productIds = cart.items.map((item) =>
      typeof item.productId === 'object' ? (item.productId as any)._id : item.productId
    );

    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map<string, any>(
      products.map((p: any) => [p._id.toString(), p])
    );

    let subtotal = 0;
    for (const item of cart.items) {
      const productId =
        typeof item.productId === 'object'
          ? (item.productId as any)._id.toString()
          : (item.productId as any).toString();
      const product = productMap.get(productId);

      if (!product) {
        throw new OrderError(`Product not found: ${productId}`, 404);
      }

      if (product.status !== 'active') {
        throw new OrderError(`Product is not active: ${product.name}`, 400);
      }

      if (product.stock < item.quantity) {
        throw new OrderError(`Insufficient stock for ${product.name}`, 400);
      }

      const price = item.salePrice || item.price || product.price;
      subtotal += price * item.quantity;
    }

    // Apply coupon discount if provided
    let discount = 0;
    let couponDiscount = 0;
    if (dto.couponCode) {
      // TODO: Implement coupon validation logic
      // For now, placeholder logic
      couponDiscount = Math.round(subtotal * 0.1); // 10% discount example
      discount = couponDiscount;
    }

    const shipping = this.calculateShipping(subtotal - discount);
    const tax = this.calculateTax(subtotal - discount + shipping);
    const grandTotal = subtotal - discount + shipping + tax;

    return {
      subtotal,
      discount,
      shipping,
      tax,
      grandTotal,
      couponCode: dto.couponCode,
      couponDiscount: couponDiscount > 0 ? couponDiscount : undefined,
    };
  }

  async createPaymentOrder(
    userId: string,
    dto: CreatePaymentOrderDto
  ): Promise<CreatePaymentOrderResponse> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Get and validate cart
      const cart = await this.cartRepo.findByUserId(userId, 'active');
      if (!cart || cart.items.length === 0) {
        throw new OrderError('Cart is empty', 400);
      }

      // Calculate order preview
      const preview = await this.previewOrder(userId, {
        couponCode: dto.couponCode,
      });

      // Generate order number
      const orderNumber = this.generateOrderNumber();

      // Create Razorpay order
      const razorpayOrder = await this.razorpayService.createOrder(
        preview.grandTotal,
        orderNumber,
        {
          userId,
          orderNumber,
        }
      );

      // Create temporary order with PAYMENT_PENDING status
      const order = await this.orderRepo.create({
        orderNumber,
        userId: new mongoose.Types.ObjectId(userId),
        items: cart.items.map((item) => {
          const productId =
            typeof item.productId === 'object'
              ? item.productId._id
              : item.productId;
          return {
            productId,
            productName: ((item.productId as any)?.name) || 'Product',
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: (item.salePrice || item.price) * item.quantity,
            salePrice: item.salePrice,
          };
        }),
        subtotal: preview.subtotal,
        discount: preview.discount,
        shippingCharge: preview.shipping,
        taxAmount: preview.tax,
        totalAmount: preview.grandTotal,
        paymentMethod: dto.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: OrderStatus.PAYMENT_PENDING,
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingAddress,
        couponCode: dto.couponCode,
        notes: dto.notes,
      });

      // Create payment transaction record
      await this.orderRepo.createPaymentTransaction({
        orderId: order._id,
        userId: new mongoose.Types.ObjectId(userId),
        paymentGateway: 'RAZORPAY',
        razorpayOrderId: razorpayOrder.id,
        amount: preview.grandTotal,
        currency: 'INR',
        status: GatewayStatus.PENDING,
        paymentMethod: dto.paymentMethod,
        gatewayResponse: razorpayOrder,
      });

      // Create status history
      await this.orderRepo.createStatusHistory({
        orderId: order._id,
        status: OrderStatus.PAYMENT_PENDING,
        remarks: 'Payment order created',
        changedByRole: 'SYSTEM',
      });

      await session.commitTransaction();

      // Get user details for prefill
      // TODO: Fetch user details from User model

      return {
        razorpayOrderId: razorpayOrder.id,
        amount: Number(razorpayOrder.amount),
        currency: razorpayOrder.currency,
        key: this.razorpayService.getKey(),
        orderName: `Order #${orderNumber}`,
        description: `Payment for order ${orderNumber}`,
        prefill: {
          name: dto.shippingAddress.fullName,
          email: '', // TODO: Get from user
          contact: dto.shippingAddress.phone,
        },
        notes: {
          orderId: order._id.toString(),
        },
      };
    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async verifyPayment(
    userId: string,
    dto: VerifyPaymentDto
  ): Promise<any> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Verify signature
      const isValid = this.razorpayService.verifyPaymentSignature(
        dto.razorpayOrderId,
        dto.razorpayPaymentId,
        dto.razorpaySignature
      );

      if (!isValid) {
        throw new OrderError('Invalid payment signature', 400);
      }

      // Find payment transaction
      const paymentTransaction =
        await this.orderRepo.findPaymentTransactionByRazorpayOrderId(
          dto.razorpayOrderId
        );

      if (!paymentTransaction) {
        throw new OrderError('Payment transaction not found', 404);
      }

      if (paymentTransaction.status === GatewayStatus.SUCCESS) {
        throw new OrderError('Payment already processed', 400);
      }

      // Fetch payment details from Razorpay
      const razorpayPayment = await this.razorpayService.fetchPayment(
        dto.razorpayPaymentId
      );

      if (razorpayPayment.status !== 'captured') {
        throw new OrderError('Payment not captured', 400);
      }

      // Update payment transaction
      await this.orderRepo.updatePaymentTransaction(paymentTransaction._id.toString(), {
        razorpayPaymentId: dto.razorpayPaymentId,
        razorpaySignature: dto.razorpaySignature,
        status: GatewayStatus.SUCCESS,
        gatewayResponse: razorpayPayment,
      });

      // Get order
      const order = await this.orderRepo.findById(
        paymentTransaction.orderId.toString()
      );

      if (!order) {
        throw new OrderError('Order not found', 404);
      }

      // Lock inventory and deduct stock
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new OrderError(`Product not found: ${item.productId}`, 404);
        }

        if (product.stock < item.quantity) {
          throw new OrderError(`Insufficient stock for ${item.productName}`, 400);
        }

        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: { stock: -item.quantity },
          },
          { session }
        );
      }

      // Update order status
      await this.orderRepo.updateWithTransaction(
        order._id.toString(),
        {
          paymentStatus: PaymentStatus.SUCCESS,
          orderStatus: OrderStatus.CONFIRMED,
        },
        session
      );

      // Create status history
      await this.orderRepo.createStatusHistory({
        orderId: order._id,
        status: OrderStatus.CONFIRMED,
        remarks: 'Payment successful, order confirmed',
        changedByRole: 'SYSTEM',
      });

      // Clear cart
      await this.cartRepo.updateById(order.userId.toString(), {
        items: [],
        totalAmount: 0,
      });

      await session.commitTransaction();

      // TODO: Send order confirmation email and WhatsApp

      return {
        success: true,
        orderNumber: order.orderNumber,
        message: 'Payment verified successfully',
      };
    } catch (error: any) {
      await session.abortTransaction();

      // Update payment transaction as failed
      const paymentTransaction =
        await this.orderRepo.findPaymentTransactionByRazorpayOrderId(
          dto.razorpayOrderId
        );

      if (paymentTransaction) {
        await this.orderRepo.updatePaymentTransaction(
          paymentTransaction._id.toString(),
          {
            status: GatewayStatus.FAILED,
            failureReason: error.message,
          }
        );

        const order = await this.orderRepo.findById(
          paymentTransaction.orderId.toString()
        );

        if (order) {
          await this.orderRepo.updateById(order._id.toString(), {
            paymentStatus: PaymentStatus.FAILED,
            orderStatus: OrderStatus.PAYMENT_FAILED,
          });

          await this.orderRepo.createStatusHistory({
            orderId: order._id,
            status: OrderStatus.PAYMENT_FAILED,
            remarks: `Payment failed: ${error.message}`,
            changedByRole: 'SYSTEM',
          });
        }
      }

      throw error;
    } finally {
      session.endSession();
    }
  }

  // async createCodOrder(userId: string, dto: CreateCodOrderDto): Promise<any> {
  //   console.log('createCodOrder called for userId:', userId);
  //   const session = await mongoose.startSession();
  //   try {
  //     session.startTransaction();

  //     // Get and validate cart
  //     console.log('Fetching cart for user:', userId);
  //     const cart = await this.cartRepo.findByUserId(userId, 'active');
  //     console.log('Cart found:', cart ? 'Yes' : 'No');
  //     console.log('Cart items:', cart?.items?.length || 0);
  //     if (!cart || cart.items.length === 0) {
  //       throw new OrderError('Cart is empty', 400);
  //     }

  //     // Calculate order preview
  //     const preview = await this.previewOrder(userId, {
  //       couponCode: dto.couponCode,
  //     });

  //     // Generate order number
  //     const orderNumber = this.generateOrderNumber();

  //     // Lock inventory and deduct stock
  //     for (const item of cart.items) {
  //       const productId =
  //         typeof item.productId === 'object'
  //           ? item.productId._id
  //           : item.productId;
  //       const product = await Product.findById(productId);

  //       if (!product) {
  //         throw new OrderError(`Product not found: ${productId}`, 404);
  //       }

  //       if (product.stock < item.quantity) {
  //         throw new OrderError(`Insufficient stock for ${product.name}`, 400);
  //       }

  //       await Product.findByIdAndUpdate(
  //         productId,
  //         {
  //           $inc: { stock: -item.quantity },
  //         },
  //         { session }
  //       );
  //     }

  //     // Create order
  //     const order = await this.orderRepo.create({
  //       orderNumber,
  //       userId: new mongoose.Types.ObjectId(userId),
  //       items: cart.items.map((item) => {
  //         const productId =
  //           typeof item.productId === 'object'
  //             ? item.productId._id
  //             : item.productId;
  //         return {
  //           productId,
  //           productName: ((item.productId as any)?.name) || 'Product',
  //           quantity: item.quantity,
  //           unitPrice: item.price,
  //           totalPrice: (item.salePrice || item.price) * item.quantity,
  //           salePrice: item.salePrice,
  //         };
  //       }),
  //       subtotal: preview.subtotal,
  //       discount: preview.discount,
  //       shippingCharge: preview.shipping,
  //       taxAmount: preview.tax,
  //       totalAmount: preview.grandTotal,
  //       paymentMethod: PaymentMethod.COD,
  //       paymentStatus: PaymentStatus.UNPAID,
  //       orderStatus: OrderStatus.PENDING,
  //       shippingAddress: dto.shippingAddress,
  //       billingAddress: dto.billingAddress,
  //       couponCode: dto.couponCode,
  //       notes: dto.notes,
  //     });

  //     // Create payment transaction record
  //     await this.orderRepo.createPaymentTransaction({
  //       orderId: order._id,
  //       userId: new mongoose.Types.ObjectId(userId),
  //       paymentGateway: 'COD',
  //       amount: preview.grandTotal,
  //       currency: 'INR',
  //       status: GatewayStatus.PENDING,
  //       paymentMethod: PaymentMethod.COD,
  //     });

  //     // Create status history
  //     await this.orderRepo.createStatusHistory({
  //       orderId: order._id,
  //       status: OrderStatus.PENDING,
  //       remarks: 'COD order created',
  //       changedByRole: 'SYSTEM',
  //     });

  //     // Clear cart
  //     await this.cartRepo.updateById(userId, {
  //       items: [],
  //       totalAmount: 0,
  //     });

  //     await session.commitTransaction();

  //     // TODO: Send order confirmation email and WhatsApp

  //     return {
  //       success: true,
  //       orderNumber: order.orderNumber,
  //       message: 'COD order created successfully',
  //     };
  //   } catch (error: any) {
  //     console.error('Error in createCodOrder:', error);
  //     await session.abortTransaction();
  //     throw error;
  //   } finally {
  //     session.endSession();
  //   }
  // }

  async createCodOrder(userId: string, dto: CreateCodOrderDto): Promise<any> {
  try {
    const cart = await this.cartRepo.findByUserId(userId, 'active');

    if (!cart || cart.items.length === 0) {
      throw new OrderError('Cart is empty', 400);
    }

    const preview = await this.previewOrder(userId, {
      couponCode: dto.couponCode,
    });

    const orderNumber = this.generateOrderNumber();

    for (const item of cart.items) {
      const productId =
        typeof item.productId === 'object'
          ? item.productId._id
          : item.productId;

      const product = await Product.findById(productId);

      if (!product) {
        throw new OrderError(`Product not found: ${productId}`, 404);
      }

      if (product.stock < item.quantity) {
        throw new OrderError(`Insufficient stock for ${product.name}`, 400);
      }

      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: -item.quantity },
      });
    }

    const order = await this.orderRepo.create({
      orderNumber,
      userId: new mongoose.Types.ObjectId(userId),
      items: cart.items.map((item) => ({
        productId:
          typeof item.productId === 'object'
            ? item.productId._id
            : item.productId,
        productName: ((item.productId as any)?.name) || 'Product',
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: (item.salePrice || item.price) * item.quantity,
        salePrice: item.salePrice,
      })),
      subtotal: preview.subtotal,
      discount: preview.discount,
      shippingCharge: preview.shipping,
      taxAmount: preview.tax,
      totalAmount: preview.grandTotal,
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.UNPAID,
      orderStatus: OrderStatus.PENDING,
      shippingAddress: dto.shippingAddress,
      billingAddress: dto.billingAddress,
      couponCode: dto.couponCode,
      notes: dto.notes,
    });

    await this.orderRepo.createPaymentTransaction({
      orderId: order._id,
      userId: new mongoose.Types.ObjectId(userId),
      paymentGateway: 'COD',
      amount: preview.grandTotal,
      currency: 'INR',
      status: GatewayStatus.PENDING,
      paymentMethod: PaymentMethod.COD,
    });

    await this.orderRepo.createStatusHistory({
      orderId: order._id,
      status: OrderStatus.PENDING,
      remarks: 'COD order created',
      changedByRole: 'SYSTEM',
    });

    await this.cartRepo.updateById(userId, {
      items: [],
      totalAmount: 0,
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      message: 'COD order created successfully',
    };
  } catch (error) {
    console.error('Error in createCodOrder:', error);
    throw error;
  }
}

  async getMyOrders(userId: string, page: number = 1, limit: number = 10) {
    const orders = await this.orderRepo.findByUserId(userId, page, limit);
    const total = await this.orderRepo.countByUserId(userId);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new OrderError('Order not found', 404);
    }

    // Check if user owns this order
    if (order.userId.toString() !== userId) {
      throw new OrderError('Access denied', 403);
    }

    const paymentTransaction =
      await this.orderRepo.findPaymentTransactionByOrderId(order._id.toString());
    const statusHistory =
      await this.orderRepo.findStatusHistoryByOrderId(order._id.toString());

    return {
      ...order.toObject(),
      paymentTransaction,
      statusHistory,
    };
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new OrderError('Order not found', 404);
    }

    if (order.userId.toString() !== userId) {
      throw new OrderError('Access denied', 403);
    }

    // Check if order can be cancelled
    if (
      ![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(
        order.orderStatus as OrderStatus
      )
    ) {
      throw new OrderError('Order cannot be cancelled', 400);
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // Restore inventory
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: { stock: item.quantity },
          },
          { session }
        );
      }

      // Update order status
      await this.orderRepo.updateWithTransaction(
        orderId,
        {
          orderStatus: OrderStatus.CANCELLED,
        },
        session
      );

      // Create status history
      await this.orderRepo.createStatusHistory({
        orderId: order._id,
        status: OrderStatus.CANCELLED,
        remarks: 'Order cancelled by user',
        changedBy: new mongoose.Types.ObjectId(userId),
        changedByRole: 'USER',
      });

      // Process refund if payment was successful
      if (order.paymentStatus === PaymentStatus.SUCCESS) {
        const paymentTransaction =
          await this.orderRepo.findPaymentTransactionByOrderId(orderId);

        if (paymentTransaction && paymentTransaction.razorpayPaymentId) {
          const refund = await this.razorpayService.refundPayment(
            paymentTransaction.razorpayPaymentId,
            order.totalAmount,
            { reason: 'Order cancelled by user' }
          );

          await this.orderRepo.updatePaymentTransaction(
            paymentTransaction._id.toString(),
            {
              status: GatewayStatus.REFUNDED,
              refundId: refund.id,
              refundAmount: order.totalAmount,
            }
          );

          await this.orderRepo.updateWithTransaction(
            orderId,
            {
              paymentStatus: PaymentStatus.REFUNDED,
            },
            session
          );
        }
      }

      await session.commitTransaction();

      // TODO: Send cancellation email

      return {
        success: true,
        message: 'Order cancelled successfully',
      };
    } catch (error: any) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
