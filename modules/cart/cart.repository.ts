import Cart, { ICart } from './cart.model';

export class CartRepository {
  async findByUserId(
    userId: string,
    status?: string
  ) {
    const filter: any = { userId };
    if (status) {
      filter.status = status;
    }
    return Cart.findOne(filter).populate(
      'items.productId',
      'name slug price salePrice stock images featuredImage'
    );
  }

  async findById(id: string) {
    return Cart.findById(id).populate(
      'items.productId',
      'name slug price salePrice stock images featuredImage'
    );
  }

  async create(data: Partial<ICart>) {
    return Cart.create(data);
  }

  async updateById(
    id: string,
    data: Partial<ICart>
  ) {
    return Cart.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true,
      }
    ).populate(
      'items.productId',
      'name slug price salePrice stock images featuredImage'
    );
  }

  async deleteById(id: string) {
    return Cart.findByIdAndDelete(id);
  }

  async updateCartItem(
    cartId: string,
    productId: string,
    updateData: any
  ) {
    return Cart.findOneAndUpdate(
      {
        _id: cartId,
        'items.productId': productId,
      },
      {
        $set: {
          'items.$': updateData,
        },
      },
      {
        new: true,
      }
    ).populate(
      'items.productId',
      'name slug price salePrice stock images featuredImage'
    );
  }

  async removeCartItem(
    cartId: string,
    productId: string
  ) {
    return Cart.findByIdAndUpdate(
      cartId,
      {
        $pull: {
          items: { productId },
        },
      },
      {
        new: true,
      }
    ).populate(
      'items.productId',
      'name slug price salePrice stock images featuredImage'
    );
  }
}
