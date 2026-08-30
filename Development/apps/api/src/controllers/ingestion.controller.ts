import { Request, Response, NextFunction } from "express";
import { telemetryTracker } from "../ingestion/telemetry";
import { firmsQueue, osmQueue } from "../queues";
import { FirmsIngestionService } from "../ingestion/firms/service";
import { OsmSyncService } from "../ingestion/osm/service";

export class IngestionController {
  /**
   * GET /api/v1/ingestion/status
   * Telemetry status for FIRMS and OSM ingestion pipelines.
   */
  static getStatus(_req: Request, res: Response) {
    const status = telemetryTracker.getStatus();
    res.json({
      success: true,
      data: status,
    });
  }

  /**
   * POST /api/v1/ingestion/firms/trigger
   * Trigger on-demand FIRMS ingestion run (Admin only).
   */
  static async triggerFirms(req: Request, res: Response, next: NextFunction) {
    try {
      const mode = req.query.async === "true" ? "async" : "sync";

      if (mode === "async") {
        const job = await firmsQueue.add("manual-firms-fetch", {
          requestedBy: req.user?.email || "admin",
          source: req.body?.source,
        });

        return res.json({
          success: true,
          message: "FIRMS ingestion job queued successfully",
          data: { jobId: job.id },
        });
      }

      // Synchronous direct execution
      const result = await FirmsIngestionService.run(req.body);
      res.json({
        success: true,
        message: "FIRMS ingestion completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ingestion/osm/trigger
   * Trigger on-demand OSM facility sync run (Admin only).
   */
  static async triggerOsm(req: Request, res: Response, next: NextFunction) {
    try {
      const mode = req.query.async === "true" ? "async" : "sync";

      if (mode === "async") {
        const job = await osmQueue.add("manual-osm-sync", {
          requestedBy: req.user?.email || "admin",
          bbox: req.body?.bbox,
        });

        return res.json({
          success: true,
          message: "OSM sync job queued successfully",
          data: { jobId: job.id },
        });
      }

      // Synchronous direct execution
      const result = await OsmSyncService.run(req.body?.bbox);
      res.json({
        success: true,
        message: "OSM sync completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

