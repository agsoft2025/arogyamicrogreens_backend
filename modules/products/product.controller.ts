import {
  Request,
  Response,
} from 'express';
import { ProductService } from './product.service';

const productService =
  new ProductService();

export class ProductController {
  async createProduct(
    req: Request,
    res: Response
  ) {
    const product =
      await productService.createProduct(
        req.body
      );

    return res.status(201).json({
      success: true,
      message:
        'Product created successfully',
      data: product,
    });
  }

  async getProducts(
    req: Request,
    res: Response
  ) {
    const data =
      await productService.getProducts(
        req.query
      );

    return res.json({
      success: true,
      message:
        'Products fetched successfully',
      data,
    });
  }

  async getProductById(
    req: Request,
    res: Response
  ) {
    const product =
      await productService.getProductById(
        String(req.params.id)
      );

    return res.json({
      success: true,
      message:
        'Product fetched successfully',
      data: product,
    });
  }

  async getProductBySlug(
    req: Request,
    res: Response
  ) {
    const product =
      await productService.getProductBySlug(
        String(req.params.slug)
      );

    return res.json({
      success: true,
      message:
        'Product fetched successfully',
      data: product,
    });
  }

  async updateProduct(
    req: Request,
    res: Response
  ) {
    const product =
      await productService.updateProduct(
        String(req.params.id),
        req.body
      );

    return res.json({
      success: true,
      message:
        'Product updated successfully',
      data: product,
    });
  }

  async deleteProduct(
    req: Request,
    res: Response
  ) {
    await productService.deleteProduct(
      String(req.params.id)
    );

    return res.json({
      success: true,
      message:
        'Product deleted successfully',
    });
  }
}
