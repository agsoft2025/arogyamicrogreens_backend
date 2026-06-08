import {
  CookieOptions,
  Request,
  Response,
} from 'express';
import { AuthService } from './auth.service';

const authService =
  new AuthService();

const accessTokenCookieName =
  'accessToken';

const accessTokenCookieOptions: CookieOptions =
  {
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    path: '/',
  };

export class AuthController {
  async sendOtp(
    req: Request,
    res: Response
  ) {
    const { mobileNumber } =
      req.body;
    await authService.sendOtp(
      mobileNumber
    );

    return res.json({
      success: true,
      message:
        'OTP sent successfully',
    });
  }

  async verifyOtp(
    req: Request,
    res: Response
  ) {
    const {
      mobileNumber,
      otp,
      name,
    } = req.body;

    const data =
      await authService.verifyOtp(
        mobileNumber,
        otp,
        name
      );

    res.cookie(
      accessTokenCookieName,
      data.accessToken,
      accessTokenCookieOptions
    );

    return res.json({
      success: true,
      message:
        'Authentication successful',
      data,
    });
  }

  async logout(
    req: Request,
    res: Response
  ) {
    res.clearCookie(
      accessTokenCookieName,
      accessTokenCookieOptions
    );

    return res.json({
      success: true,
      message:
        'Logged out successfully',
    });
  }
}
