// Runs before any test file is imported, so env.config.ts sees these values.
process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1d";
process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";
process.env.AWS_S3_BUCKET_NAME = "test-bucket";
process.env.FRONTEND_ORIGIN = "http://localhost:5173";
process.env.MONGO_URI = process.env.TEST_MONGO_URI ?? "";
