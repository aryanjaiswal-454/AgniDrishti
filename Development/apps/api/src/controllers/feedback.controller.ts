import { Request, Response, NextFunction } from "express";
import { FeedbackService } from "../services/feedback.service";

export class FeedbackController {
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const feedback = await FeedbackService.submitFeedback(
        req.params.id,
        req.body,
        req.user!.userId
      );
      res.status(201).json({
        success: true,
        message: "Analyst feedback recorded successfully",
        data: feedback,
      });
    } catch (error) {
      next(error);
    }
  }
}

