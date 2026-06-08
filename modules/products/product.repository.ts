import { QueryFilter } from 'mongoose';
import Product, {
  IProduct,
} from './product.model';

export class ProductRepository {
  async create(
    data: Partial<IProduct>
  ) {
    return Product.create(data);
  }

  async findAll(
    filter: QueryFilter<IProduct>,
    page: number,
    limit: number
  ) {
    const skip = (page - 1) * limit;

    const [items, total] =
      await Promise.all([
        Product.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Product.countDocuments(filter),
      ]);

    return {
      items,
      total,
    };
  }

  async findById(id: string) {
    return Product.findById(id);
  }

  async findBySlug(slug: string) {
    return Product.findOne({ slug });
  }

  async updateById(
    id: string,
    data: Partial<IProduct>
  ) {
    return Product.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async deleteById(id: string) {
    return Product.findByIdAndDelete(id);
  }
}
