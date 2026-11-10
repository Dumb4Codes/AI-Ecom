import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import cookieParser from "cookie-parser";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { envConfig } from "./config/env.config";
import { apiLimiter } from "./middlewares/rateLimit.middleware";
import passport from "./config/passport.config";
import routes from "./routes";
import webhookRouter from "./routes/webhook.route";

/**
 * Builds the Express app without starting a server or touching the database,
 * so it can be imported by tests (supertest) as well as by `index.ts`.
 */
export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  if (envConfig.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(
    helmet({
      // The SPA may be served from a different origin than the API.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(compression());

  // Stripe needs the raw body, so mount before express.json().
  app.use("/api/webhook", webhookRouter);

  app.use(
    cors({
      origin: envConfig.FRONTEND_ORIGIN,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));
  app.use(cookieParser());
  app.use(passport.initialize());

  app.get("/health", (_req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
      message: "Server is running",
      status: "healthy",
    });
  });

  app.use("/api", apiLimiter, routes);

  // Unknown API routes should be a JSON 404, not the SPA shell.
  app.use("/api", (_req: Request, res: Response) => {
    res.status(HTTPSTATUS.NOT_FOUND).json({
      message: "Route not found",
      errorCode: "ERR_NOT_FOUND",
    });
  });

  if (envConfig.NODE_ENV === "production") {
    const clientPath = path.resolve(__dirname, "../../client/dist");
    app.use(
      express.static(clientPath, {
        // Hashed build assets are immutable; index.html must always revalidate.
        setHeaders: (res, filePath) => {
          if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      }),
    );
    app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
      res.sendFile(path.join(clientPath, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
};
