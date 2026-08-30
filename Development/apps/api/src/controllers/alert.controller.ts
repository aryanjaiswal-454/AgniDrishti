import { Request, Response, NextFunction } from "express";
import { AlertService } from "../services/alert.service";

export class AlertController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AlertService.getAlerts(req.query as any);
      res.json({
        success: true,
        data: result.alerts,
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

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const alert = await AlertService.updateAlertStatus(
        req.params.id,
        req.body,
        req.user!.userId
      );
      res.json({
        success: true,
        message: `Alert status updated to '${alert.status}'`,
        data: alert,
      });
    } catch (error) {
      next(error);
    }
  }
}

