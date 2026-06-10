import { Router } from 'express';
import orderController from './order.controller';
import { requireAuth } from '../../middlewares/auth.middleware';

const router = Router();

// Customer Routes
router.post('/preview', requireAuth, orderController.previewOrder.bind(orderController));
router.post('/create-payment-order', requireAuth, orderController.createPaymentOrder.bind(orderController));
router.post('/verify-payment', requireAuth, orderController.verifyPayment.bind(orderController));
router.post('/create-cod-order', requireAuth, orderController.createCodOrder.bind(orderController));
router.get('/my-orders', requireAuth, orderController.getMyOrders.bind(orderController));
router.get('/:id', requireAuth, orderController.getOrderById.bind(orderController));
router.put('/cancel/:id', requireAuth, orderController.cancelOrder.bind(orderController));

// Admin Routes
router.get('/admin/orders', requireAuth, orderController.getAllOrders.bind(orderController));
router.get('/admin/orders/:id', requireAuth, orderController.getAdminOrderById.bind(orderController));
router.put('/admin/orders/status/:id', requireAuth, orderController.updateOrderStatus.bind(orderController));
router.post('/admin/orders/refund/:id', requireAuth, orderController.refundOrder.bind(orderController));

export default router;
