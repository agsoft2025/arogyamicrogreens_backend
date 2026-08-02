import mongoose from 'mongoose';
import { CartRepository } from './cart.repository';
import { AddToCartDto, UpdateCartItemDto } from './cart.types';
import Product from '../products/product.model';

export class CartError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
  }
}

export class CartService {
  private cartRepo = new CartRepository();

  async getCart(userId: string) {
    const cart =
      await this.cartRepo.findByUserId(
        userId,
        'active'
      );

    if (!cart) {
      return this.cartRepo.create({
        userId: new mongoose.Types.ObjectId(
          userId
        ),
        items: [],
        totalAmount: 0,
        status: 'active',
      });
    }

    return cart;
  }

  async addToCart(
    userId: string,
    data: AddToCartDto
  ) {
    if (!data.productId || !mongoose.Types.ObjectId.isValid(data.productId)) {
      throw new CartError('Invalid product ID', 400);
    }
    if (!data.quantity || data.quantity < 1) {
      throw new CartError('Quantity must be at least 1', 400);
    }

    const product =
      await Product.findById(data.productId);

    if (!product) {
      throw new CartError(
        'Product not found',
        404
      );
    }

    if (product.status !== 'active') {
      throw new CartError(
        'Product is not available',
        400
      );
    }

    if (product.stock < data.quantity) {
      throw new CartError(
        'Insufficient stock',
        400
      );
    }

    let cart =
      await this.cartRepo.findByUserId(
        userId,
        'active'
      );

    const itemPrice = product.salePrice
      ? product.salePrice
      : product.price;

    if (!cart) {
      cart = await this.cartRepo.create({
        userId: new mongoose.Types.ObjectId(
          userId
        ),
        items: [
          {
            productId: new mongoose.Types.ObjectId(
              data.productId
            ),
            quantity: data.quantity,
            price: product.price,
            salePrice: product.salePrice,
          },
        ],
        totalAmount: itemPrice * data.quantity,
        status: 'active',
      });
    } else {
      const existingItemIndex =
        cart.items.findIndex((item) => {
          if (!item.productId) return false;
          const pid = item.productId as any;
          const idStr = pid._id
            ? pid._id.toString()
            : pid.toString();
          return idStr === data.productId;
        });

      if (existingItemIndex > -1) {
        const newQuantity =
          cart.items[existingItemIndex]
            .quantity + data.quantity;

        if (product.stock < newQuantity) {
          throw new CartError(
            'Insufficient stock',
            400
          );
        }

        cart.items[
          existingItemIndex
        ].quantity = newQuantity;
      } else {
        cart.items.push({
          productId: new mongoose.Types.ObjectId(
            data.productId
          ),
          quantity: data.quantity,
          price: product.price,
          salePrice: product.salePrice,
        });
      }

      // Strip any items with null productId (orphaned refs from deleted products)
      const validItems = cart.items.filter((item) => item.productId != null);
      cart.totalAmount = this.calculateTotal(validItems);

      cart = await this.cartRepo.updateById(
        cart._id.toString(),
        {
          items: validItems,
          totalAmount: cart.totalAmount,
        }
      );
    }

    return cart;
  }

  async updateCartItem(
    userId: string,
    productId: string,
    data: UpdateCartItemDto
  ) {
    console.log('updateCartItem called:', { userId, productId, quantity: data.quantity });

    const cart =
      await this.cartRepo.findByUserId(
        userId,
        'active'
      );

    if (!cart) {
      throw new CartError('Cart not found', 404);
    }
    const itemIndex = cart.items.findIndex((item) => {
      if (!item.productId) return false;
      const pid = item.productId as any;
      const idStr = pid._id
        ? pid._id.toString()
        : pid.toString();
      return idStr === productId;
    });

    if (itemIndex === -1) {
      throw new CartError(
        'Item not found in cart',
        404
      );
    }

    console.log('Current item quantity:', cart.items[itemIndex].quantity);
    console.log('New quantity:', data.quantity);

    const product =
      await Product.findById(productId);

    if (product && product.stock < data.quantity) {
      throw new CartError(
        'Insufficient stock',
        400
      );
    }

    if (data.quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity =
        data.quantity;
    }

    // Strip orphaned items (product deleted from DB → populate returns null)
    const validItems = cart.items.filter((item) => item.productId != null);
    cart.totalAmount = this.calculateTotal(validItems);

    const updatedCart =
      await this.cartRepo.updateById(
        cart._id.toString(),
        {
          items: validItems,
          totalAmount: cart.totalAmount,
        }
      );

    if (!updatedCart) {
      throw new CartError('Failed to update cart', 500);
    }

    return updatedCart;
  }

  async removeFromCart(
    userId: string,
    productId: string
  ) {
    console.log("Removing from cart", userId, productId);
    const cart =
      await this.cartRepo.findByUserId(
        userId,
        'active'
      );

    if (!cart) {
      throw new CartError('Cart not found', 404);
    }

    const itemIndex = cart.items.findIndex((item) => {
      if (!item.productId) return false;
      const pid = item.productId as any;
      const idStr = pid._id
        ? pid._id.toString()
        : pid.toString();
      return idStr === productId;
    });

    if (itemIndex === -1) {
      throw new CartError(
        'Item not found in cart',
        404
      );
    }

    cart.items.splice(itemIndex, 1);

    // Strip any other orphaned items before saving
    const validItems = cart.items.filter((item) => item.productId != null);
    cart.totalAmount = this.calculateTotal(validItems);

    const updatedCart =
      await this.cartRepo.updateById(
        cart._id.toString(),
        {
          items: validItems,
          totalAmount: cart.totalAmount,
        }
      );

    if (!updatedCart) {
      throw new CartError('Failed to update cart', 500);
    }

    return updatedCart;
  }

  async clearCart(userId: string) {
    const cart =
      await this.cartRepo.findByUserId(
        userId,
        'active'
      );

    if (!cart) {
      throw new CartError('Cart not found', 404);
    }

    cart.items = [];
    cart.totalAmount = 0;

    const updatedCart =
      await this.cartRepo.updateById(
        cart._id.toString(),
        {
          items: [],
          totalAmount: 0,
        }
      );

    if (!updatedCart) {
      throw new CartError('Failed to clear cart', 500);
    }

    return updatedCart;
  }

  private calculateTotal(items: any[]): number {
    return items.reduce((total, item) => {
      const price = item.salePrice || item.price;
      return total + price * item.quantity;
    }, 0);
  }
}

