# Order Management Module

Production-grade order management system with Razorpay integration for the AgriNest e-commerce platform.

## Features

- **Secure Checkout Flow**: Complete cart validation, price calculation, and order creation
- **Razorpay Integration**: Secure payment processing with signature verification
- **COD Support**: Cash on delivery order creation
- **MongoDB Transactions**: Atomic inventory management and order creation
- **Webhook Handling**: Real-time payment status updates
- **Order Status Tracking**: Complete order lifecycle management
- **Inventory Management**: Automatic stock deduction and restoration
- **Refund Processing**: Automated refund handling via Razorpay

## Installation

### 1. Install Dependencies

```bash
cd agrinest_backend
npm install razorpay
```

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Database Models

The following collections will be created automatically:

- `orders` - Order documents
- `paymenttransactions` - Payment transaction records
- `orderstatushistories` - Order status change history

## API Endpoints

### Customer Endpoints

#### Preview Order
```http
POST /api/v1/orders/preview
Authorization: Bearer <token>
Content-Type: application/json

{
  "couponCode": "SAVE10"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subtotal": 5000,
    "discount": 500,
    "shipping": 100,
    "tax": 828,
    "grandTotal": 5428,
    "couponCode": "SAVE10",
    "couponDiscount": 500
  }
}
```

#### Create Payment Order (Razorpay)
```http
POST /api/v1/orders/create-payment-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "RAZORPAY",
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "9876543210",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "billingAddress": {
    "fullName": "John Doe",
    "phone": "9876543210",
    "addressLine1": "123 Main St",
    "addressLine2": "Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "couponCode": "SAVE10",
  "notes": "Please deliver between 9 AM - 5 PM"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "razorpayOrderId": "order_1234567890",
    "amount": 542800,
    "currency": "INR",
    "key": "rzp_test_1234567890",
    "orderName": "Order #ORDABC123XYZ",
    "description": "Payment for order ORDABC123XYZ",
    "prefill": {
      "name": "John Doe",
      "email": "john@example.com",
      "contact": "9876543210"
    },
    "notes": {
      "orderId": "507f1f77bcf86cd799439011"
    }
  }
}
```

#### Verify Payment
```http
POST /api/v1/orders/verify-payment
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpayOrderId": "order_1234567890",
  "razorpayPaymentId": "pay_1234567890",
  "razorpaySignature": "generated_signature"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "orderNumber": "ORDABC123XYZ",
    "message": "Payment verified successfully"
  }
}
```

#### Create COD Order
```http
POST /api/v1/orders/create-cod-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": {
    "fullName": "John Doe",
    "phone": "9876543210",
    "addressLine1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "billingAddress": {
    "fullName": "John Doe",
    "phone": "9876543210",
    "addressLine1": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "couponCode": "SAVE10",
  "notes": "Please call before delivery"
}
```

#### Get My Orders
```http
GET /api/v1/orders/my-orders?page=1&limit=10
Authorization: Bearer <token>
```

#### Get Order by ID
```http
GET /api/v1/orders/:id
Authorization: Bearer <token>
```

#### Cancel Order
```http
PUT /api/v1/orders/cancel/:id
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get All Orders
```http
GET /api/v1/orders/admin/orders?page=1&limit=10&status=CONFIRMED
Authorization: Bearer <admin_token>
```

#### Get Order Details (Admin)
```http
GET /api/v1/orders/admin/orders/:id
Authorization: Bearer <admin_token>
```

#### Update Order Status
```http
PUT /api/v1/orders/admin/orders/status/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "SHIPPED",
  "remarks": "Order shipped via FedEx"
}
```

#### Process Refund
```http
POST /api/v1/orders/admin/orders/refund/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "amount": 5000,
  "reason": "Product damaged during delivery"
}
```

### Webhook Endpoint

#### Razorpay Webhook
```http
POST /api/v1/webhooks/razorpay
Content-Type: application/json
X-Razorpay-Signature: <webhook_signature>

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_1234567890",
        "amount": 542800,
        "currency": "INR",
        "status": "captured"
      }
    }
  }
}
```

**Supported Events:**
- `payment.captured` - Payment successful
- `payment.failed` - Payment failed
- `refund.processed` - Refund completed
- `order.paid` - Order paid

## Order Status Flow

```
PAYMENT_PENDING
    ↓ (Payment Success)
PAYMENT_SUCCESS → CONFIRMED
    ↓
PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED

PAYMENT_FAILED (Payment Failure)
CANCELLED (User cancellation)
RETURN_REQUESTED → RETURNED → REFUNDED
```

## Security Features

### Implemented
- **JWT Authentication**: All endpoints require valid JWT tokens
- **Signature Verification**: Razorpay payment and webhook signatures verified
- **MongoDB Transactions**: Atomic operations for inventory and order creation
- **Input Validation**: All request bodies validated
- **Price Validation**: Backend recalculates all prices (never trusts frontend)
- **Stock Validation**: Double-check stock before order creation
- **Error Handling**: Centralized error handling with proper HTTP status codes

### To Implement
- **Rate Limiting**: Prevent API abuse
- **Idempotency Keys**: Prevent duplicate order creation
- **Role-Based Access**: Admin-only endpoints
- **Audit Logs**: Track all order modifications

## Database Schema

### Order Schema
```typescript
{
  orderNumber: string;        // Unique order identifier
  userId: ObjectId;           // User reference
  items: [{
    productId: ObjectId;      // Product reference
    productName: string;      // Product name (snapshot)
    sku: string;              // Product SKU
    quantity: number;         // Order quantity
    unitPrice: number;        // Price at order time
    totalPrice: number;       // Total for this item
    salePrice?: number;       // Sale price if applicable
  }];
  subtotal: number;           // Items total
  discount: number;           // Applied discount
  shippingCharge: number;     // Shipping cost
  taxAmount: number;          // Tax amount
  totalAmount: number;        // Final amount
  paymentMethod: 'RAZORPAY' | 'COD';
  paymentStatus: 'UNPAID' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  orderStatus: 'PAYMENT_PENDING' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 
                'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 
                'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 
                'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED' | 'REFUNDED';
  shippingAddress: Address;
  billingAddress: Address;
  couponCode?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Payment Transaction Schema
```typescript
{
  orderId: ObjectId;
  userId: ObjectId;
  paymentGateway: string;      // 'RAZORPAY' or 'COD'
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REFUNDED';
  paymentMethod: 'RAZORPAY' | 'COD';
  gatewayResponse?: any;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Order Status History Schema
```typescript
{
  orderId: ObjectId;
  status: OrderStatus;
  remarks?: string;
  changedBy?: ObjectId;
  changedByRole: 'USER' | 'ADMIN' | 'SYSTEM';
  createdAt: Date;
}
```

## Testing

### Manual Testing Flow

1. **Add items to cart**
2. **Preview order**: `POST /api/v1/orders/preview`
3. **Create payment order**: `POST /api/v1/orders/create-payment-order`
4. **Complete payment on Razorpay**
5. **Verify payment**: `POST /api/v1/orders/verify-payment`
6. **Check order status**: `GET /api/v1/orders/:id`

### COD Testing Flow

1. **Add items to cart**
2. **Preview order**: `POST /api/v1/orders/preview`
3. **Create COD order**: `POST /api/v1/orders/create-cod-order`
4. **Check order status**: `GET /api/v1/orders/:id`

## Error Handling

All errors follow the standard response format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common error codes:
- `400` - Bad Request (validation error, insufficient stock)
- `403` - Forbidden (access denied)
- `404` - Not Found (order/cart not found)
- `500` - Internal Server Error

## Notifications

### Email (To Implement)
- Order confirmation
- Payment success
- Order status updates
- Cancellation confirmation

### WhatsApp (To Implement)
- Order confirmation
- Shipment updates
- Delivery updates

## File Structure

```
modules/order/
├── order.model.ts                    # Order schema
├── payment-transaction.model.ts       # Payment transaction schema
├── order-status-history.model.ts      # Status history schema
├── order.types.ts                    # TypeScript interfaces
├── order.repository.ts               # Database operations
├── razorpay.service.ts               # Razorpay integration
├── order.service.ts                  # Business logic
├── order.controller.ts               # Request handlers
├── order.routes.ts                   # Route definitions
├── webhook.controller.ts             # Webhook handlers
├── webhook.routes.ts                 # Webhook routes
└── README.md                         # This file
```

## Production Checklist

- [ ] Install razorpay npm package
- [ ] Configure Razorpay environment variables
- [ ] Set up Razorpay webhook in dashboard
- [ ] Implement rate limiting middleware
- [ ] Add idempotency key support
- [ ] Implement role-based access control
- [ ] Add audit logging
- [ ] Set up email notification service
- [ ] Set up WhatsApp notification service
- [ ] Configure proper CORS settings
- [ ] Enable HTTPS in production
- [ ] Set up monitoring and alerting
- [ ] Implement backup strategy
- [ ] Load test the payment flow
- [ ] Test webhook endpoints with Razorpay

## Troubleshooting

### Payment Verification Fails
- Check Razorpay key and secret in `.env`
- Verify webhook signature is correct
- Check payment status in Razorpay dashboard

### Order Creation Fails
- Verify cart is not empty
- Check product stock availability
- Ensure all products are active
- Validate shipping/billing address format

### Webhook Not Received
- Verify webhook URL is correct in Razorpay dashboard
- Check webhook secret matches
- Ensure server is accessible from internet
- Check server logs for webhook requests

## Support

For issues or questions, contact the development team.
