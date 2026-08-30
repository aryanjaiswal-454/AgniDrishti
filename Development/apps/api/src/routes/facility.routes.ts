import { Router } from "express";
import { FacilityController } from "../controllers/facility.controller";
import { validateQuery, validateParams } from "../middleware/validate";
import { facilityQuerySchema, facilityParamsSchema } from "../schemas/facility.schema";
import { authenticate } from "../middleware/auth";

const router = Router();

// Protect all facility endpoints (accessible to all authenticated roles: admin, analyst, viewer)
router.use(authenticate);

router.get("/", validateQuery(facilityQuerySchema), FacilityController.list);
router.get("/:id", validateParams(facilityParamsSchema), FacilityController.getById);
router.get("/:id/timeseries", validateParams(facilityParamsSchema), FacilityController.getTimeseries);

export default router;

