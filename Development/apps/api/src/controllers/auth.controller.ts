import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import config from "../config";

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await AuthService.login(req.body);

      // Set secure httpOnly cookie
      res.cookie(config.jwt.cookieName, token, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? "strict" : "lax",
        maxAge: config.jwt.cookieMaxAgeMs,
      });

      res.json({
        success: true,
        message: "Authentication successful",
        data: {
          user,
          token, // also return in response for clients that prefer Bearer header
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie(config.jwt.cookieName, {
        httpOnly: true,
        secure: config.isProduction,
        sameSite: config.isProduction ? "strict" : "lax",
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
}

