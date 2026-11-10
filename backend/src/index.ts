import "dotenv/config";
import mongoose from "mongoose";
import { envConfig } from "./config/env.config";
import { connectDatabase } from "./config/database.config";
import { createApp } from "./app";

const start = async () => {
  // Connect first so we never accept traffic we cannot serve.
  await connectDatabase();

  const app = createApp();
  const server = app.listen(envConfig.PORT, () => {
    console.log(
      `Server running on port ${envConfig.PORT} in ${envConfig.NODE_ENV} mode`,
    );
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
    // Force-exit if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
