import mongoose from 'mongoose';
import User from '../users/user.model';
import RefreshToken from './refresh-token.model';

export class AuthRepository {
  // --- User methods ---

  async findUserByMobile(mobileNumber: string) {
    return User.findOne({ mobileNumber });
  }

  async findUserById(userId: string) {
    return User.findById(userId);
  }

  async createUser(data: { name: string; mobileNumber: string }) {
    return User.create({ ...data, isMobileVerified: true });
  }

  // --- Refresh token methods ---

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return RefreshToken.create({
      userId: new mongoose.Types.ObjectId(userId),
      tokenHash,
      expiresAt,
    });
  }

  async findRefreshToken(tokenHash: string) {
    return RefreshToken.findOne({ tokenHash });
  }

  async deleteRefreshToken(tokenHash: string) {
    return RefreshToken.deleteOne({ tokenHash });
  }

  /** Revoke all sessions for a user (security event). */
  async deleteAllUserRefreshTokens(userId: string) {
    return RefreshToken.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
    });
  }
}
