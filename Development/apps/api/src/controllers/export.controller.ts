import { Request, Response, NextFunction } from "express";
import { ExportService } from "../services/export.service";

export class ExportController {
  static async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      await ExportService.exportData(req.query as any, res);
    } catch (error) {
      next(error);
    }
  }
}

