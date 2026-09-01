import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

export class AuthController {

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      // Firebase manages session mostly on frontend, but we can clear any old cookies just in case
      res.clearCookie("agnidrishti_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      res.json({
        success: true,
        message: "Successfully logged out",
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getCurrentUser(req.user!.userId);
      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}
