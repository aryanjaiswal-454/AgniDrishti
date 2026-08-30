import { Router } from "express";
import authRoutes from "./auth.routes";
import facilityRoutes from "./facility.routes";
import hotspotRoutes from "./hotspot.routes";
import eventRoutes from "./event.routes";
import alertRoutes from "./alert.routes";
import dashboardRoutes from "./dashboard.routes";
import exportRoutes from "./export.routes";
import ingestionRoutes from "./ingestion.routes";

const apiRouter = Router();

// Mount domain routes under /api/v1
apiRouter.use("/auth", authRoutes);
apiRouter.use("/facilities", facilityRoutes);
apiRouter.use("/hotspots", hotspotRoutes);
apiRouter.use("/events", eventRoutes);
apiRouter.use("/alerts", alertRoutes);
apiRouter.use("/dashboard", dashboardRoutes);
apiRouter.use("/export", exportRoutes);
apiRouter.use("/ingestion", ingestionRoutes);

export default apiRouter;

