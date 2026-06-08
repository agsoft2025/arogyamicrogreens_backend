import { AuthRepository } from './auth.repository';
import { generateOtp } from '../../common/utils/otp';
import { generateAccessToken } from '../../config/jwt';

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

  async sendOtp(
    mobileNumber: string
  ) {
     let user =
      await this.authRepo.findUserByMobile(
        mobileNumber
      );
      console.log("<><>user",user)
    const now = Date.now();
    const existingOtp =
      otpStore.get(mobileNumber);
    if (
      existingOtp &&
      now - existingOtp.windowStartedAt <
        OTP_WINDOW_MS &&
      existingOtp.sendCount >= OTP_LIMIT
    ) {
      throw new AuthError(
        'OTP send limit reached. Please try again after 60 minutes',
        429
      );
    }

    const otp = generateOtp();
    const isCurrentWindow =
      existingOtp &&
      now - existingOtp.windowStartedAt <
        OTP_WINDOW_MS;

    otpStore.set(mobileNumber, {
      otp,
      sendCount: isCurrentWindow
        ? existingOtp.sendCount + 1
        : 1,
      windowStartedAt: isCurrentWindow
        ? existingOtp.windowStartedAt
        : now,
      expiresAt: now + OTP_WINDOW_MS,
    });

    console.log(
      `OTP for ${mobileNumber}: ${otp}`
    );

    return true;
  }

  async verifyOtp(
    mobileNumber: string,
    otp: string,
    name?: string
  ) {
    const otpRecord =
      otpStore.get(mobileNumber);
    const now = Date.now();

    if (
      !otpRecord ||
      otpRecord.expiresAt < now ||
      otpRecord.otp !== otp
    ) {
      throw new AuthError(
        'Invalid OTP'
      );
    }

    let user =
      await this.authRepo.findUserByMobile(
        mobileNumber
      );

    if (!user) {
      if (!name) {
        throw new AuthError(
          'Name is required'
        );
      }

      user =
        await this.authRepo.createUser({
          name,
          mobileNumber,
        });
    }

    otpStore.delete(mobileNumber);

    const accessToken =
      generateAccessToken(
        user._id.toString()
      );

    return {
      user,
      accessToken,
    };
  }
}
