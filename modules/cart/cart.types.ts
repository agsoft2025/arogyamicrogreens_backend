import { CartStatus } from './cart.model';

export type AddToCartDto = {
  productId: string;
  quantity: number;
};

export type UpdateCartItemDto = {
  quantity: number;
};

export type CartResponse = {
  _id: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    salePrice?: number;
  }>;
  totalAmount: number;
  status: CartStatus;
  createdAt: string;
  updatedAt: string;
};
