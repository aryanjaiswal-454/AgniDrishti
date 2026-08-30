import { Router } from "express";
import { HotspotController } from "../controllers/hotspot.controller";
import { validateQuery, validateParams } from "../middleware/validate";
import { hotspotQuerySchema, hotspotParamsSchema } from "../schemas/hotspot.schema";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/", validateQuery(hotspotQuerySchema), HotspotController.list);
router.get("/:id", validateParams(hotspotParamsSchema), HotspotController.getById);

export default router;

