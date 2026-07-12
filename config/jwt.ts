import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Access token: short-lived (15 minutes)
export const ACCESS_TOKEN_EXPIRY = '15m';
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;

// Refresh token: long-lived (30 days)
export const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Issues a short-lived JWT access token (15 min).
 */
export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET as string,
    { expiresIn: ACCESS_TOKEN_EXPIRY as any }
  );
};

/**
 * Generates a cryptographically secure random refresh token (128 hex chars).
 * This is the plain-text value -- always hash it before storing in the DB.
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * SHA-256 hash of a token.
 * Store this in the DB; never store the raw token.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
