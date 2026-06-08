import multer from 'multer';

const TWO_MB = 2 * 1024 * 1024;

class UploadError extends Error {
  statusCode = 400;
}

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: TWO_MB,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(
        new UploadError(
          'Only image files are allowed'
        )
      );
    }

    return cb(null, true);
  },
});
