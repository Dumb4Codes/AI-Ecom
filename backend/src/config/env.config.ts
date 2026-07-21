import { getEnv } from "../utils/get-env.util";

export const envConfig = {
  NODE_ENV: getEnv("NODE_ENV"),
  PORT: getEnv("PORT"),
  MONGO_URI: getEnv("MONGO_URI"),

  JWT_SECRET: getEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN"),

  STRIPE_SECRET_KEY: getEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: getEnv("STRIPE_WEBHOOK_SECRET"),

  AWS_REGION: getEnv("AWS_REGION"),
  AWS_ACCESS_KEY_ID: getEnv("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: getEnv("AWS_SECRET_ACCESS_KEY"),
  AWS_S3_BUCKET_NAME: getEnv("AWS_S3_BUCKET_NAME"),
  
  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN"),
};
