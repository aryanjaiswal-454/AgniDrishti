import { Request, Response, NextFunction } from "express";
import { FacilityService } from "../services/facility.service";

export class FacilityController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FacilityService.getFacilities(req.query as any);
      res.json({
        success: true,
        data: result.facilities,
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
      const facility = await FacilityService.getFacilityById(req.params.id);
      res.json({
        success: true,
        data: facility,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTimeseries(req: Request, res: Response, next: NextFunction) {
    try {
      const timeseries = await FacilityService.getFacilityTimeseries(req.params.id);
      res.json({
        success: true,
        data: timeseries,
      });
    } catch (error) {
      next(error);
    }
  }
}

