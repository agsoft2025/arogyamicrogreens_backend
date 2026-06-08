import { QueryFilter } from 'mongoose';
import User, { IUser } from './user.model';

export class UserRepository {
  async create(data: Partial<IUser>) {
    return User.create(data);
  }

  async findAll(
    filter: QueryFilter<IUser>,
    page: number,
    limit: number
  ) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      items,
      total,
    };
  }

  async findById(id: string) {
    return User.findById(id);
  }

  async findByMobileNumber(mobileNumber: string) {
    return User.findOne({ mobileNumber });
  }

  async findByEmail(email: string) {
    return User.findOne({ email });
  }

  async updateById(
    id: string,
    data: Partial<IUser>
  ) {
    return User.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async deleteById(id: string) {
    return User.findByIdAndDelete(id);
  }
}
