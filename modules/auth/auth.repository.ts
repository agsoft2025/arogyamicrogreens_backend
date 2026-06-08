import User from '../users/user.model';

export class AuthRepository {
  async findUserByMobile(
    mobileNumber: string
  ) {
    const user = User.findOne({ mobileNumber });
    return User.findOne({ mobileNumber });
  }

  async createUser(data: {
    name: string;
    mobileNumber: string;
  }) {
    return User.create({
      ...data,
      isMobileVerified: true,
    });
  }
}