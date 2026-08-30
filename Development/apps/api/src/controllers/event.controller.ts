import { Request, Response, NextFunction } from "express";
import { EventService } from "../services/event.service";

export class EventController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EventService.getEvents(req.query as any);
      res.json({
        success: true,
        data: result.events,
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
      const event = await EventService.getEventById(req.params.id);
      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }
}

