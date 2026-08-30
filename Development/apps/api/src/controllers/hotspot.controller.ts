import { Request, Response, NextFunction } from "express";
import { HotspotService } from "../services/hotspot.service";

export class HotspotController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await HotspotService.getHotspots(req.query as any);
      res.json({
        success: true,
        data: result.hotspots,
        meta: {
          total: result.total,
          limit: req.query.limit,
          offset: req.query.offset,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const hotspot = await HotspotService.getHotspotById(req.params.id);
      res.json({
        success: true,
        data: hotspot,
      });
    } catch (error) {
      next(error);
    }
  }
}

