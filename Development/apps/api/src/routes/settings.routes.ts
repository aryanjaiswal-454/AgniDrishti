import { Router } from "express";
import { SettingsController } from "../controllers/settings.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { updateSystemSettingsSchema } from "../schemas/settings.schema";

const router = Router();

router.use(authenticate);
router.get("/", SettingsController.get);
router.patch("/", requireRole("admin"), validateBody(updateSystemSettingsSchema), SettingsController.update);

export default router;
