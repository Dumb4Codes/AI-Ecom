import { Router } from "express";
import {
  registerController,
  loginController,
  logoutController,
  authStatusController,
} from "../controllers/auth.controller";
import { authLimiter } from "../middlewares/rateLimit.middleware";
import { passportAuthenticateJwt } from "../config/passport.config";

const authRoutes = Router();

authRoutes.post("/register", authLimiter, registerController);
authRoutes.post("/login", authLimiter, loginController);
authRoutes.post("/logout", logoutController);
authRoutes.get("/status", passportAuthenticateJwt, authStatusController);

export default authRoutes;
