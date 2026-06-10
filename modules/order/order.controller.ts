import { Request, Response } from 'express';
import { OrderService } from './order.service';
import { OrderError } from './order.types';
import {
  PreviewOrderDto,
  CreatePaymentOrderDto,
  CreateCodOrderDto,
  VerifyPaymentDto,
  UpdateOrderStatusDto,
  RefundOrderDto,
} from './order.types';

const orderService = new OrderService();

export class OrderController {
  async previewOrder(req: any, res: Response) {
    try {
      const userId = req.userId;
      const dto: PreviewOrderDto = req.body;

      const preview = await orderService.previewOrder(userId, dto);

      return res.json({
        success: true,
        data: preview,
      });
    } catch (error: any) {
      if (error instanceof OrderError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to preview order',
      });
    }
  }

  async createPaymentOrder(req: any, res: Response) {
    try {
      const userId = req.userId;
      const dto: CreatePaymentOrderDto = req.body;

      const paymentOrder = await orderService.createPaymentOrder(userId, dto);

      return res.json({
        success: true,
        data: paymentOrder,
      });
    } catch (error: any) {
      if (error instanceof OrderError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
      });
    }
  }

  async verifyPayment(req: any, res: Response) {
    try {
      const userId = req.userId;
      const dto: VerifyPaymentDto = req.body;

      const result = await orderService.verifyPayment(userId, dto);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error instanceof OrderError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
      });
    }
  }

  async createCodOrder(req: any, res: Response) {
    try {
      const userId = req.userId;
      const dto: CreateCodOrderDto = req.body;

      const result = await orderService.createCodOrder(userId, dto);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error instanceof OrderError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to create COD order',
      });
    }
  }

  async getMyOrders(req: any, res: Response) {
    try {
      const userId = req.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await orderService.getMyOrders(userId, page, limit);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
      });
    }
  }

  async getOrderById(req: any, res: Response) {
    try {
      const userId = req.userId;
      const orderId = req.params.id;

      const order = await orderService.getOrderById(orderId, userId);

      return res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      if (error instanceof OrderError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
      });
    }
  }

  async cancelOrder(req: any, res: Response) {
    try {
      const userId = req.userId;
      const orderId = req.params.id;

      const result = await orderService.cancelOrder(orderId, userId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error instanceof OrderError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel order',
      });
    }
  }

  // Admin methods
  async getAllOrders(req: any, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status;

      // TODO: Implement admin order listing with filters
      return res.json({
        success: true,
        data: {
          orders: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch orders',
      });
    }
  }

  async getAdminOrderById(req: any, res: Response) {
    try {
      const orderId = req.params.id;

      // TODO: Implement admin order details
      return res.json({
        success: true,
        data: null,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch order',
      });
    }
  }

  async updateOrderStatus(req: any, res: Response) {
    try {
      const orderId = req.params.id;
      const dto: UpdateOrderStatusDto = req.body;
      const adminId = req.userId;

      // TODO: Implement admin status update
      return res.json({
        success: true,
        message: 'Order status updated successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update order status',
      });
    }
  }

  async refundOrder(req: any, res: Response) {
    try {
      const orderId = req.params.id;
      const dto: RefundOrderDto = req.body;

      // TODO: Implement admin refund
      return res.json({
        success: true,
        message: 'Refund processed successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process refund',
      });
    }
  }
}

export default new OrderController();
