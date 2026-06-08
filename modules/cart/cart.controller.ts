import {
  Response,
} from 'express';
import { CartService, CartError } from './cart.service';
import { AuthRequest } from '../../middlewares/auth.middleware';

const cartService = new CartService();

export class CartController {
  async getCart(
    req: AuthRequest,
    res: Response
  ) {
    const cart = await cartService.getCart(
      req.userId!
    );

    return res.json({
      success: true,
      message: 'Cart fetched successfully',
      data: cart,
    });
  }

  async addToCart(
    req: AuthRequest,
    res: Response
  ) {
    const cart = await cartService.addToCart(
      req.userId!,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: cart,
    });
  }

  async updateCartItem(
    req: AuthRequest,
    res: Response
  ) {
    const cart =
      await cartService.updateCartItem(
        req.userId!,
        String(req.params.productId),
        req.body
      );

    return res.json({
      success: true,
      message:
        'Cart item updated successfully',
      data: cart,
    });
  }

  async removeFromCart(
    req: AuthRequest,
    res: Response
  ) {
    const cart =
      await cartService.removeFromCart(
        req.userId!,
        String(req.params.productId)
      );

    return res.json({
      success: true,
      message:
        'Item removed from cart successfully',
      data: cart,
    });
  }

  async clearCart(
    req: AuthRequest,
    res: Response
  ) {
    const cart = await cartService.clearCart(
      req.userId!
    );

    return res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: cart,
    });
  }
}
