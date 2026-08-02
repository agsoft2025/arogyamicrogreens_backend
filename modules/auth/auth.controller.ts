import { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_EXPIRY_MS,
} from '../../config/jwt';

const authService = new AuthService();

// --- Cookie configurations ---

const ACCESS_TOKEN_COOKIE: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: ACCESS_TOKEN_MAX_AGE_MS, // 15 minutes
  path: '/',
};

/**
 * Refresh token cookie is restricted to /api/v1/auth so the browser only
 * sends it to auth endpoints, not to cart, orders, products, etc.
 */
const REFRESH_TOKEN_COOKIE: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: REFRESH_TOKEN_EXPIRY_MS, // 30 days
  path: '/api/v1/auth',
};

// --- Cookie parser helper (no cookie-parser dependency) ---

function getCookieValue(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const segment of header.split(';')) {
    const eqIdx = segment.indexOf('=');
    if (eqIdx === -1) continue;
    const cookieName = segment.slice(0, eqIdx).trim();
    if (cookieName === name) {
      return decodeURIComponent(segment.slice(eqIdx + 1).trim());
    }
  }
  return undefined;
}

// --- Controller ---

export class AuthController {
  async sendOtp(req: Request, res: Response) {
    const { mobileNumber } = req.body;
    console.log("<><>mobileNumber",mobileNumber)
    const response = await authService.sendOtp(mobileNumber);
    return res.json({
      success: true,
      message: 'OTP sent successfully',
      data: response,
    });
  }

  async verifyOtp(req: Request, res: Response) {
    const { mobileNumber, otp, name } = req.body;
    const data = await authService.verifyOtp(mobileNumber, otp, name);

    res.cookie('accessToken', data.accessToken, ACCESS_TOKEN_COOKIE);
    res.cookie('refreshToken', data.refreshToken, REFRESH_TOKEN_COOKIE);

    // Never expose the refresh token in the response body
    return res.json({
      success: true,
      message: 'Authentication successful',
      data: { user: data.user, accessToken: data.accessToken },
    });
  }

  async refreshToken(req: Request, res: Response) {
    const refreshToken = getCookieValue(req, 'refreshToken');

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    const data = await authService.refreshAccessToken(refreshToken);

    // Rotate: set new access + refresh token cookies
    res.cookie('accessToken', data.accessToken, ACCESS_TOKEN_COOKIE);
    res.cookie('refreshToken', data.refreshToken, REFRESH_TOKEN_COOKIE);

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { accessToken: data.accessToken },
    });
  }

  async logout(req: Request, res: Response) {
    const refreshToken = getCookieValue(req, 'refreshToken');

    // Invalidate the refresh token in the DB (best-effort)
    await authService.logout(refreshToken).catch(() => {});

    res.clearCookie('accessToken', ACCESS_TOKEN_COOKIE);
    res.clearCookie('refreshToken', REFRESH_TOKEN_COOKIE);

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
