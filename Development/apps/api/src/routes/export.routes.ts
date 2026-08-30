import { Router } from "express";
import { ExportController } from "../controllers/export.controller";
import { validateQuery } from "../middleware/validate";
import { exportQuerySchema } from "../schemas/feedback.schema";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(exportQuerySchema), ExportController.exportData);

export default router;

