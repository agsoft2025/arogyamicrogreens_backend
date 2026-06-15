import mongoose, {
  Document,
  Schema,
} from 'mongoose';

export type ProductStatus =
  | 'active'
  | 'inactive'
  | 'draft';

export interface IProductSeo {
  metaTitle?: string;
  metaDescription?: string;
}

export type ProductCategory = 'product' | 'microgreen';

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  category: ProductCategory;
  price: number;
  salePrice?: number;
  stock: number;
  shortDescription?: string;
  description?: string;
  benefits: string[];
  images: string[];
  featuredImage?: string;
  weight?: number;
  weightUnit?: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  status: ProductStatus;
  tags: string[];
  seo?: IProductSeo;
}

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: ["product", "microgreen"],
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    benefits: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    featuredImage: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      min: 0,
    },
    weightUnit: {
      type: String,
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft'],
      default: 'active',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    seo: {
      metaTitle: {
        type: String,
        trim: true,
      },
      metaDescription: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({
  name: 'text',
  slug: 'text',
  sku: 'text',
  tags: 'text',
});

export default mongoose.model<IProduct>(
  'Product',
  ProductSchema
);
