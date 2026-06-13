import { IOrder, IOrderItem, IShippingAddress, IBillingAddress } from '../modules/order/order.model';

export interface OrderNotificationData {
  order: {
    _id: any;
    orderNumber: string;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      salePrice?: number;
    }>;
    subtotal: number;
    discount: number;
    shippingCharge: number;
    taxAmount: number;
    totalAmount: number;
    paymentMethod: string;
    shippingAddress: IShippingAddress;
    billingAddress: IBillingAddress;
    couponCode?: string;
    notes?: string;
    createdAt: Date;
  };
  user: {
    _id: any;
    name: string;
    email?: string;
    mobileNumber: string;
  } | null;
  razorpayPaymentId: string;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatAddress(addr: IShippingAddress | IBillingAddress): string {
  const parts = [
    addr.addressLine1,
    addr.addressLine2,
    addr.city,
    addr.state,
    addr.postalCode,
    addr.country,
  ].filter(Boolean);
  return parts.join(', ');
}

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' IST';
}

/**
 * Builds the subject line and HTML body for an order notification email.
 * Uses actual field names from order.model.ts, user.model.ts, and payment-transaction.model.ts.
 */
export function buildOrderNotificationEmail(data: OrderNotificationData): {
  subject: string;
  html: string;
} {
  const { order, user, razorpayPaymentId } = data;

  const subject = `New Order Received - #${order.orderNumber}`;

  // Colours
  const green = '#1b3c2a';
  const accent = '#386b00';
  const lightGreen = '#f0f7ea';
  const border = '#e3e3dd';
  const text = '#1a1c19';
  const muted = '#424843';

  // ── Items rows ──────────────────────────────────────────────
  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid ${border};color:${text};">${item.productName}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${border};text-align:center;color:${text};">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${border};text-align:right;color:${text};">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid ${border};text-align:right;color:${text};font-weight:600;">${formatCurrency(item.totalPrice)}</td>
    </tr>
  `).join('');

  // ── Optional rows (only shown if value exists / non-zero) ──
  const discountRow = order.discount > 0 ? `
    <tr>
      <td colspan="2" style="padding:6px 12px;color:${muted};text-align:right;">Discount</td>
      <td style="padding:6px 12px;text-align:right;color:#ba1a1a;">- ${formatCurrency(order.discount)}</td>
    </tr>` : '';

  const taxRow = order.taxAmount > 0 ? `
    <tr>
      <td colspan="2" style="padding:6px 12px;color:${muted};text-align:right;">Tax (GST)</td>
      <td style="padding:6px 12px;text-align:right;color:${text};">${formatCurrency(order.taxAmount)}</td>
    </tr>` : '';

  const shippingRow = order.shippingCharge > 0 ? `
    <tr>
      <td colspan="2" style="padding:6px 12px;color:${muted};text-align:right;">Shipping</td>
      <td style="padding:6px 12px;text-align:right;color:${text};">${formatCurrency(order.shippingCharge)}</td>
    </tr>` : `
    <tr>
      <td colspan="2" style="padding:6px 12px;color:${muted};text-align:right;">Shipping</td>
      <td style="padding:6px 12px;text-align:right;color:${accent};font-weight:600;">FREE</td>
    </tr>`;

  const couponRow = order.couponCode ? `
    <tr>
      <td style="padding:6px 12px;color:${muted};">Coupon Code</td>
      <td style="padding:6px 12px;color:${text};">${order.couponCode}</td>
    </tr>` : '';

  const notesRow = order.notes ? `
    <tr>
      <td style="padding:6px 12px;color:${muted};vertical-align:top;">Notes</td>
      <td style="padding:6px 12px;color:${text};">${order.notes}</td>
    </tr>` : '';

  const userEmail = user?.email || '—';
  const userPhone = user?.mobileNumber || order.shippingAddress.phone || '—';
  const userName = user?.name || order.shippingAddress.fullName;
  const userId = user?._id?.toString() || '—';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${border};">

          <!-- Header -->
          <tr>
            <td style="background:${green};padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">AgriNest Microgreens</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Order Notification</p>
            </td>
          </tr>

          <!-- Alert banner -->
          <tr>
            <td style="background:${lightGreen};padding:16px 32px;border-bottom:1px solid ${border};">
              <p style="margin:0;color:${accent};font-weight:700;font-size:14px;">
                ✅ New Order Received — #${order.orderNumber}
              </p>
              <p style="margin:4px 0 0;color:${muted};font-size:12px;">${formatDateTime(order.createdAt)}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 32px;">

              <!-- Customer Details -->
              <h2 style="margin:0 0 12px;color:${green};font-size:15px;font-weight:700;border-bottom:2px solid ${lightGreen};padding-bottom:8px;">Customer Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:5px 0;color:${muted};font-size:13px;width:130px;">Name</td>
                  <td style="padding:5px 0;color:${text};font-size:13px;font-weight:600;">${userName}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:${muted};font-size:13px;">Email</td>
                  <td style="padding:5px 0;color:${text};font-size:13px;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:${muted};font-size:13px;">Phone</td>
                  <td style="padding:5px 0;color:${text};font-size:13px;">${userPhone}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:${muted};font-size:13px;">User ID</td>
                  <td style="padding:5px 0;color:${text};font-size:13px;font-family:monospace;font-size:12px;">${userId}</td>
                </tr>
              </table>

              <!-- Order Details -->
              <h2 style="margin:0 0 12px;color:${green};font-size:15px;font-weight:700;border-bottom:2px solid ${lightGreen};padding-bottom:8px;">Order Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:5px 0;color:${muted};font-size:13px;width:130px;">Order ID</td>
                  <td style="padding:5px 0;color:${text};font-size:13px;font-family:monospace;font-size:12px;">${order._id}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:${muted};font-size:13px;">Order Number</td>
                  <td style="padding:5px 0;color:${text};font-size:13px;font-weight:700;">${order.orderNumber}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:${muted};font-size:13px;">Payment ID</td>
                  <td style="padding:5px 0;color:${text};font-size:13px;font-family:monospace;font-size:12px;">${razorpayPaymentId}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:${muted};font-size:13px;">Payment Status</td>
                  <td style="padding:5px 0;"><span style="background:${lightGreen};color:${accent};padding:2px 10px;border-radius:12px;font-size:12px;font-weight:700;">SUCCESS</span></td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:${muted};font-size:13px;">Payment Method</td>
                  <td style="padding:5px 0;color:${text};font-size:13px;">${order.paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;color:${muted};font-size:13px;">Order Date</td>
                  <td style="padding:5px 0;color:${text};font-size:13px;">${formatDateTime(order.createdAt)}</td>
                </tr>
                ${couponRow}
                ${notesRow}
              </table>

              <!-- Products Ordered -->
              <h2 style="margin:0 0 12px;color:${green};font-size:15px;font-weight:700;border-bottom:2px solid ${lightGreen};padding-bottom:8px;">Products Ordered</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid ${border};border-radius:8px;overflow:hidden;">
                <thead>
                  <tr style="background:${lightGreen};">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:${muted};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Product</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:${muted};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;color:${muted};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Unit Price</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;color:${muted};font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <!-- Order Summary -->
              <h2 style="margin:0 0 12px;color:${green};font-size:15px;font-weight:700;border-bottom:2px solid ${lightGreen};padding-bottom:8px;">Order Summary</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding:6px 12px;color:${muted};text-align:right;">Subtotal</td>
                  <td style="padding:6px 12px;text-align:right;color:${text};">${formatCurrency(order.subtotal)}</td>
                </tr>
                ${discountRow}
                ${taxRow}
                ${shippingRow}
                <tr>
                  <td colspan="3" style="padding:4px 12px;"><hr style="border:none;border-top:2px solid ${border};margin:4px 0;" /></td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:10px 12px;color:${green};font-weight:700;text-align:right;font-size:15px;">Grand Total</td>
                  <td style="padding:10px 12px;text-align:right;color:${green};font-weight:700;font-size:15px;">${formatCurrency(order.totalAmount)}</td>
                </tr>
              </table>

              <!-- Addresses -->
              <h2 style="margin:0 0 12px;color:${green};font-size:15px;font-weight:700;border-bottom:2px solid ${lightGreen};padding-bottom:8px;">Addresses</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="50%" style="padding:0 8px 0 0;vertical-align:top;">
                    <div style="background:${lightGreen};border-radius:8px;padding:14px 16px;">
                      <p style="margin:0 0 6px;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:${accent};">Shipping Address</p>
                      <p style="margin:0;font-size:13px;color:${text};line-height:1.6;">
                        <strong>${order.shippingAddress.fullName}</strong><br/>
                        ${order.shippingAddress.phone}<br/>
                        ${formatAddress(order.shippingAddress)}
                      </p>
                    </div>
                  </td>
                  <td width="50%" style="padding:0 0 0 8px;vertical-align:top;">
                    <div style="background:#f9f9f9;border-radius:8px;padding:14px 16px;border:1px solid ${border};">
                      <p style="margin:0 0 6px;font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:${muted};">Billing Address</p>
                      <p style="margin:0;font-size:13px;color:${text};line-height:1.6;">
                        <strong>${order.billingAddress.fullName}</strong><br/>
                        ${order.billingAddress.phone}<br/>
                        ${formatAddress(order.billingAddress)}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${green};padding:20px 32px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">
                AgriNest Microgreens &bull; KPHB 9th Phase, Hyderabad, Telangana &bull; This is an automated notification.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
