import {
  NextFunction,
  Request,
  Response,
} from 'express';
import jwt from 'jsonwebtoken';
import User from '../modules/users/user.model';

type AccessTokenPayload = {
  userId: string;
};

export interface AuthRequest extends Request {
  userId?: string;
}

const getCookieValue = (
  cookieHeader: string | undefined,
  cookieName: string
) => {
  if (!cookieHeader) {
    return undefined;
  }

  const cookies =
    cookieHeader.split(';');

  for (const cookie of cookies) {
    const [name, ...value] =
      cookie.trim().split('=');

    if (name === cookieName) {
      return decodeURIComponent(
        value.join('=')
      );
    }
  }

  return undefined;
};

const getAccessToken = (
  req: Request
) => {
  const authHeader =
    req.headers.authorization;

  if (
    authHeader?.startsWith('Bearer ')
  ) {
    return authHeader.slice(7);
  }

  return getCookieValue(
    req.headers.cookie,
    'accessToken'
  );
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getAccessToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AccessTokenPayload;

    const user = await User.findById(
      decoded.userId
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message:
          'Admin access required',
      });
    }

    req.userId = decoded.userId;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        'Invalid or expired token',
    });
  }
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getAccessToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as AccessTokenPayload;

    const user = await User.findById(
      decoded.userId
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      });
    }

    req.userId = decoded.userId;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        'Invalid or expired token',
    });
  }
};
