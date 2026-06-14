import mongoose, {
  QueryFilter,
} from 'mongoose';
import {
  IProduct,
  ProductCategory,
  ProductStatus,
} from './product.model';
import { ProductRepository } from './product.repository';

type ProductListQuery = {
  page?: string;
  limit?: string;
  search?: string;
  status?: ProductStatus;
  category?: ProductCategory;
  isFeatured?: string;
  isBestSeller?: string;
};

const VALID_CATEGORIES: ProductCategory[] = ['product', 'microgreen'];

export class ProductError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
  }
}

export class ProductService {
  private productRepo =
    new ProductRepository();

  async createProduct(
    data: Partial<IProduct>
  ) {
    this.validateCategory(data.category);
    return this.productRepo.create(data);
  }

  async getProducts(
    query: ProductListQuery
  ) {
    const page = this.parsePositiveNumber(
      query.page,
      1
    );
    const limit = Math.min(
      this.parsePositiveNumber(
        query.limit,
        10
      ),
      100
    );
    const filter: QueryFilter<IProduct> = {};

    if (query.search) {
      filter.name = {
        $regex: query.search,
        $options: 'i',
      };
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      this.validateCategory(query.category);
      filter.category = query.category;
    }

    if (
      query.isFeatured === 'true' ||
      query.isFeatured === 'false'
    ) {
      filter.isFeatured =
        query.isFeatured === 'true';
    }

    if (
      query.isBestSeller === 'true' ||
      query.isBestSeller === 'false'
    ) {
      filter.isBestSeller =
        query.isBestSeller === 'true';
    }

    const { items, total } =
      await this.productRepo.findAll(
        filter,
        page,
        limit
      );

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductById(id: string) {
    this.validateObjectId(id);

    const product =
      await this.productRepo.findById(id);

    if (!product) {
      throw new ProductError(
        'Product not found',
        404
      );
    }

    return product;
  }

  async getProductBySlug(slug: string) {
    const product =
      await this.productRepo.findBySlug(slug);

    if (!product) {
      throw new ProductError(
        'Product not found',
        404
      );
    }

    return product;
  }

  async updateProduct(
    id: string,
    data: Partial<IProduct>
  ) {
    this.validateObjectId(id);

    if (data.category) {
      this.validateCategory(data.category);
    }

    const product =
      await this.productRepo.updateById(
        id,
        data
      );

    if (!product) {
      throw new ProductError(
        'Product not found',
        404
      );
    }

    return product;
  }

  async deleteProduct(id: string) {
    this.validateObjectId(id);

    const product =
      await this.productRepo.deleteById(id);

    if (!product) {
      throw new ProductError(
        'Product not found',
        404
      );
    }

    return product;
  }

  private validateCategory(
    category?: ProductCategory | string
  ) {
    if (!category) {
      throw new ProductError(
        'Category is required'
      );
    }
    if (!VALID_CATEGORIES.includes(category as ProductCategory)) {
      throw new ProductError(
        `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`
      );
    }
  }

  private parsePositiveNumber(
    value: string | undefined,
    fallback: number
  ) {
    const parsed = Number(value);

    if (
      !value ||
      Number.isNaN(parsed) ||
      parsed < 1
    ) {
      return fallback;
    }

    return Math.floor(parsed);
  }

  private validateObjectId(
    id: string,
    message = 'Invalid product ID'
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      throw new ProductError(message);
    }
  }
}
