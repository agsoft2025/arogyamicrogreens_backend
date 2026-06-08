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
        cart.items.findIndex(
          (item) =>
            item.productId.toString() ===
            data.productId
        );

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

      cart.totalAmount = this.calculateTotal(
        cart.items
      );

      cart = await this.cartRepo.updateById(
        cart._id.toString(),
        {
          items: cart.items,
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
    const cart =
      await this.cartRepo.findByUserId(
        userId,
        'active'
      );

    if (!cart) {
      throw new CartError('Cart not found', 404);
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() ===
        productId
    );

    if (itemIndex === -1) {
      throw new CartError(
        'Item not found in cart',
        404
      );
    }

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

    cart.totalAmount = this.calculateTotal(
      cart.items
    );

    const updatedCart =
      await this.cartRepo.updateById(
        cart._id.toString(),
        {
          items: cart.items,
          totalAmount: cart.totalAmount,
        }
      );

    return updatedCart;
  }

  async removeFromCart(
    userId: string,
    productId: string
  ) {
    const cart =
      await this.cartRepo.findByUserId(
        userId,
        'active'
      );

    if (!cart) {
      throw new CartError('Cart not found', 404);
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() ===
        productId
    );

    if (itemIndex === -1) {
      throw new CartError(
        'Item not found in cart',
        404
      );
    }

    cart.items.splice(itemIndex, 1);
    cart.totalAmount = this.calculateTotal(
      cart.items
    );

    const updatedCart =
      await this.cartRepo.updateById(
        cart._id.toString(),
        {
          items: cart.items,
          totalAmount: cart.totalAmount,
        }
      );

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

    return updatedCart;
  }

  private calculateTotal(items: any[]): number {
    return items.reduce((total, item) => {
      const price = item.salePrice || item.price;
      return total + price * item.quantity;
    }, 0);
  }
}
