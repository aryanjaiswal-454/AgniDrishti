import { Router } from "express";
import { AlertController } from "../controllers/alert.controller";
import { validateQuery, validateParams, validateBody } from "../middleware/validate";
import {
  alertQuerySchema,
  alertParamsSchema,
  updateAlertStatusSchema,
} from "../schemas/alert.schema";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// View alerts (admin, analyst, viewer)
router.get("/", validateQuery(alertQuerySchema), AlertController.list);

// Mutate alert status (admin and analyst only)
router.patch(
  "/:id",
  requireRole("analyst", "admin"),
  validateParams(alertParamsSchema),
  validateBody(updateAlertStatusSchema),
  AlertController.updateStatus
);

export default router;

