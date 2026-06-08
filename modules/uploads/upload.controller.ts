import {
  Request,
  Response,
} from 'express';
import { uploadFile } from './upload.service';

export class UploadController {
  async uploadImages(
    req: Request,
    res: Response
  ) {
    const files =
      req.files as
        | Express.Multer.File[]
        | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'At least one image is required',
      });
    }

    const uploads = await Promise.all(
      files.map((file) =>
        uploadFile(file)
      )
    );

    return res.status(201).json({
      success: true,
      message:
        'Images uploaded successfully',
      data: uploads,
    });
  }
}
