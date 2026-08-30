import { Router } from "express";
import { EventController } from "../controllers/event.controller";
import { FeedbackController } from "../controllers/feedback.controller";
import { validateQuery, validateParams, validateBody } from "../middleware/validate";
import { eventQuerySchema, eventParamsSchema } from "../schemas/event.schema";
import { submitFeedbackSchema } from "../schemas/feedback.schema";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(eventQuerySchema), EventController.list);
router.get("/:id", validateParams(eventParamsSchema), EventController.getById);

// Submit analyst feedback (analyst and admin only)
router.post(
  "/:id/feedback",
  requireRole("analyst", "admin"),
  validateParams(eventParamsSchema),
  validateBody(submitFeedbackSchema),
  FeedbackController.submit
);

export default router;

