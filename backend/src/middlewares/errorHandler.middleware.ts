import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import multer from "multer";
import { AppError, ErrorCodes } from "../utils/app-error";
import { HTTPSTATUS } from "../config/http.config";
import { envConfig } from "../config/env.config";

const formatZodError = (error: ZodError) => {
  return error.issues.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
};

const respond = (
  res: Response,
  status: number,
  message: string,
  errorCode: string,
  extra: Record<string, unknown> = {},
) => {
  res.status(status).json({ message, errorCode, ...extra });
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return respond(res, HTTPSTATUS.BAD_REQUEST, "Validation failed", ErrorCodes.ERR_VALIDATION, {
      errors: formatZodError(err),
    });
  }

  if (err instanceof AppError) {
    return respond(res, err.statusCode, err.message, err.errorCode);
  }

  // Upload problems (file too large, too many files, ...) are client errors.
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large. Maximum size is 5MB per image."
        : err.message;
    return respond(res, HTTPSTATUS.BAD_REQUEST, message, ErrorCodes.ERR_BAD_REQUEST);
  }

  // Malformed ids in params/queries.
  if (err instanceof mongoose.Error.CastError) {
    return respond(res, HTTPSTATUS.BAD_REQUEST, "Invalid identifier", ErrorCodes.ERR_BAD_REQUEST);
  }

  // body-parser errors: invalid JSON, payload too large, ...
  const httpErr = err as Error & { status?: number; type?: string };
  if (httpErr.type === "entity.parse.failed") {
    return respond(res, HTTPSTATUS.BAD_REQUEST, "Malformed JSON body", ErrorCodes.ERR_BAD_REQUEST);
  }
  if (httpErr.type === "entity.too.large") {
    return respond(res, 413, "Request body too large", ErrorCodes.ERR_BAD_REQUEST);
  }

  // Anything else is unexpected: log it (with stack) but never leak it.
  if (envConfig.NODE_ENV !== "test" || process.env.LOG_TEST_ERRORS) {
    console.error(`[${req.method}] ${req.path} failed:`, err);
  }
  return respond(
    res,
    HTTPSTATUS.INTERNAL_SERVER_ERROR,
    "Internal Server Error",
    ErrorCodes.ERR_INTERNAL,
  );
};
