import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { s3Client } from '../../r2.config';
import { PutObjectCommand } from '@aws-sdk/client-s3';

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

// export const uploadFile = async (
//   file: Express.Multer.File
// ) => {
//   await fs.mkdir(uploadDirectory, {
//     recursive: true,
//   });

//   const fileName = `${Date.now()}-${crypto.randomUUID()}${getFileExtension(file)}`;
//   const filePath = path.join(
//     uploadDirectory,
//     fileName
//   );

//   await fs.writeFile(
//     filePath,
//     file.buffer
//   );

//   return {
//     originalName: file.originalname,
//     fileName,
//     mimeType: file.mimetype,
//     size: file.size,
//     url: `/uploads/images/${fileName}`,
//   };
// };

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string
) => {
  const fileName = `${Date.now()}-${
    file.originalname
  }`;

  const key = `${folder}/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket:
        process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    key,
    url: `${process.env.R2_PUBLIC_URL}/${key}`,
  };
};