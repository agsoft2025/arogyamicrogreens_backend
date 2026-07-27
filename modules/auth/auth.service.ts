import { AuthRepository } from './auth.repository';
import { generateOtp } from '../../common/utils/otp';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_EXPIRY_MS,
} from '../../config/jwt';

type OtpRecord = {
  otp: string;
  sendCount: number;
  windowStartedAt: number;
  expiresAt: number;
};

const OTP_LIMIT = 3;
const OTP_WINDOW_MS = 60 * 60 * 1000;
const otpStore = new Map<string, OtpRecord>();

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
  }
}

export class AuthService {
  private authRepo = new AuthRepository();

  async sendOtp(mobileNumber: string) {
    const now = Date.now();
    const existingOtp = otpStore.get(mobileNumber);

    if (
      existingOtp &&
      now - existingOtp.windowStartedAt < OTP_WINDOW_MS &&
      existingOtp.sendCount >= OTP_LIMIT
    ) {
      throw new AuthError(
        'OTP send limit reached. Please try again after 60 minutes',
        429
      );
    }

    const otp = generateOtp();
    const isCurrentWindow =
      existingOtp && now - existingOtp.windowStartedAt < OTP_WINDOW_MS;

    otpStore.set(mobileNumber, {
      otp,
      sendCount: isCurrentWindow ? existingOtp.sendCount + 1 : 1,
      windowStartedAt: isCurrentWindow ? existingOtp.windowStartedAt : now,
      expiresAt: now + OTP_WINDOW_MS,
    });

    console.log(`OTP for ${mobileNumber}: ${otp}`);

    // If the user already exists, return their name so the UI can pre-fill it
    const existingUser = await this.authRepo.findUserByMobile(mobileNumber);
    return { success: true, otp, existingName: existingUser?.name ?? null };
  }

  async verifyOtp(mobileNumber: string, otp: string, name?: string) {
    const otpRecord = otpStore.get(mobileNumber);
    const now = Date.now();

    if (!otpRecord || otpRecord.expiresAt < now || otpRecord.otp !== otp) {
      throw new AuthError('Invalid OTP');
    }

    let user = await this.authRepo.findUserByMobile(mobileNumber);

    if (!user) {
      if (!name) throw new AuthError('Name is required');
      user = await this.authRepo.createUser({ name, mobileNumber });
    }

    otpStore.delete(mobileNumber);

    // Issue both tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.authRepo.saveRefreshToken(
      user._id.toString(),
      hashToken(refreshToken),
      expiresAt
    );

    return { user, accessToken, refreshToken };
  }

  /**
   * Validates the refresh token, rotates it (deletes old, issues new pair),
   * and returns a fresh access token + refresh token.
   *
   * Rotation means a stolen refresh token can only be used once before it
   * becomes invalid -- subsequent use of the old token reveals a compromise.
   */
  async refreshAccessToken(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.authRepo.findRefreshToken(tokenHash);

    if (!stored) {
      throw new AuthError('Refresh token invalid or already used', 401);
    }

    if (stored.expiresAt < new Date()) {
      await this.authRepo.deleteRefreshToken(tokenHash);
      throw new AuthError('Refresh token expired', 401);
    }

    // Delete before issuing new -- prevents replay if the response is lost mid-flight
    await this.authRepo.deleteRefreshToken(tokenHash);

    const user = await this.authRepo.findUserById(stored.userId.toString());
    if (!user) {
      throw new AuthError('User not found', 401);
    }

    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.authRepo.saveRefreshToken(
      user._id.toString(),
      hashToken(newRefreshToken),
      expiresAt
    );

    return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Invalidates the specific refresh token on logout.
   * If no token is provided (cookie missing), server-side state is still
   * ended -- the client clears its cookies regardless.
   */
  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    await this.authRepo.deleteRefreshToken(hashToken(refreshToken));
  }
}
