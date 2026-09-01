import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";
import { registerSchema } from "../schemas/auth.schema";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

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
