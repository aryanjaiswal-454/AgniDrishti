import { Router } from "express";
import { IngestionController } from "../controllers/ingestion.controller";
import { authenticate, requireRole } from "../middleware/auth";

const router = Router();

// Protect all ingestion routes
router.use(authenticate);

// Telemetry status viewable by all authenticated users (admin, analyst, viewer)
router.get("/status", IngestionController.getStatus);

// On-demand manual trigger endpoints (admin only)
router.post("/firms/trigger", requireRole("admin"), IngestionController.triggerFirms);
router.post("/osm/trigger", requireRole("admin"), IngestionController.triggerOsm);

export default router;

