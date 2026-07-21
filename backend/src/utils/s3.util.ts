import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import s3Client from "../config/s3.config";
import { envConfig } from "../config/env.config";

interface UploadImageResult {
  url: string;
  key: string;
}

export const uploadImageToS3 = async (
  file: Express.Multer.File,
  folder = "products"
): Promise<UploadImageResult> => {
  const extension = path.extname(file.originalname) || "";
  const key = `${folder}/${randomUUID()}${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: envConfig.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const url = `https://${envConfig.AWS_S3_BUCKET_NAME}.s3.${envConfig.AWS_REGION}.amazonaws.com/${key}`;

  return { url, key };
};

export const uploadMultipleImagesToS3 = async (
  files: Express.Multer.File[],
  folder = "products"
): Promise<UploadImageResult[]> => {
  const uploadPromises = files.map((file) => uploadImageToS3(file, folder));
  return Promise.all(uploadPromises);
};
