import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { authenticate, requireRole } from "../middleware/auth";
import rateLimit from "express-rate-limit";
import config from "../config";

const router = Router();

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxAuth,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many authentication attempts. Please try again later.",
    },
  },
});

router.post("/login", authLimiter, validateBody(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", authenticate, AuthController.me);

// Internal user creation — ADMIN ONLY
router.post(
  "/register",
  authenticate,
  requireRole("admin"),
  validateBody(registerSchema),
  AuthController.register
);

export default router;

