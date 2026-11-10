import { rateLimit } from "express-rate-limit";
import { envConfig } from "../config/env.config";

const isTest = envConfig.NODE_ENV === "test";

const build = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => isTest,
    message: { message, errorCode: "ERR_RATE_LIMITED" },
  });

/** Broad safety net for every /api request. */
export const apiLimiter = build(
  15 * 60 * 1000,
  600,
  "Too many requests, please try again later.",
);

/** Brute-force protection for login / register. */
export const authLimiter = build(
  15 * 60 * 1000,
  30,
  "Too many authentication attempts, please try again later.",
);

/** AI generation costs money, keep it tight. */
export const aiLimiter = build(
  60 * 1000,
  10,
  "Too many AI requests, please slow down.",
);
