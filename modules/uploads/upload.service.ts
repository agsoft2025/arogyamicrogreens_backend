import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const uploadDirectory = path.join(
  process.cwd(),
  'uploads',
  'images'
);

const getFileExtension = (
  file: Express.Multer.File
) => {
  const ext = path.extname(
    file.originalname
  );

  if (ext) {
    return ext.toLowerCase();
  }

  return file.mimetype.replace(
    'image/',
    '.'
  );
};

export const uploadFile = async (
  file: Express.Multer.File
) => {
  await fs.mkdir(uploadDirectory, {
    recursive: true,
  });

  const fileName = `${Date.now()}-${crypto.randomUUID()}${getFileExtension(file)}`;
  const filePath = path.join(
    uploadDirectory,
    fileName
  );

  await fs.writeFile(
    filePath,
    file.buffer
  );

  return {
    originalName: file.originalname,
    fileName,
    mimeType: file.mimetype,
    size: file.size,
    url: `/uploads/images/${fileName}`,
  };
};
