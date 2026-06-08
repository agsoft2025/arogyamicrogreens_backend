import {
  NextFunction,
  Request,
  Response,
  Router,
} from 'express';
import multer from 'multer';
import { requireAdmin } from '../../middlewares/auth.middleware';
import { UploadController } from './upload.controller';
import { imageUpload } from './upload.middleware';

const router = Router();
const controller =
  new UploadController();

const uploadImages = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  imageUpload.array('images', 10)(
    req,
    res,
    (error) => {
      if (error instanceof multer.MulterError) {
        error.message =
          error.code === 'LIMIT_FILE_SIZE'
            ? 'Image size must be below 2 MB'
            : error.message;
        return next(error);
      }

      return next(error);
    }
  );
};

router.post(
  '/images',
  requireAdmin,
  uploadImages,
  controller.uploadImages
);

export default router;
