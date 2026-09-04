import { Request, Response, NextFunction } from "express";
import { SettingsService } from "../services/settings.service";

export class SettingsController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await SettingsService.updateSettings(req.body, req.user!.userId);
      res.json({
        success: true,
        message: "Settings saved and existing events, alerts, KPIs, and map markers recalculated.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
