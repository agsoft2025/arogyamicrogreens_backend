import mongoose, { QueryFilter } from 'mongoose';
import { IUser, UserStatus } from './user.model';
import { UserRepository } from './user.repository';
import { CreateUserDto, UpdateUserDto, UserListQuery } from './user.types';

export class UserError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
  }
}

export class UserService {
  private userRepo = new UserRepository();

  async createUser(data: CreateUserDto) {
    const existingUser =
      await this.userRepo.findByMobileNumber(
        data.mobileNumber
      );

    if (existingUser) {
      throw new UserError(
        'User with this mobile number already exists',
        409
      );
    }

    if (data.email) {
      const existingEmail =
        await this.userRepo.findByEmail(
          data.email
        );

      if (existingEmail) {
        throw new UserError(
          'User with this email already exists',
          409
        );
      }
    }

    return this.userRepo.create({
      ...data,
      status: 'active',
    });
  }

  async getUsers(
    query: UserListQuery,
    currentUserId?: string
  ) {
    const page = this.parsePositiveNumber(
      query.page,
      1
    );
    const limit = Math.min(
      this.parsePositiveNumber(
        query.limit,
        10
      ),
      100
    );

    const filter: QueryFilter<IUser> = {};

    if (query.name) {
      filter.name = {
        $regex: query.name,
        $options: 'i',
      };
    }

    if (query.mobile) {
      filter.mobileNumber = query.mobile;
    }

    if (query.email) {
      filter.email = {
        $regex: query.email,
        $options: 'i',
      };
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (currentUserId) {
      filter._id = { $ne: currentUserId };
    }

    const { items, total } =
      await this.userRepo.findAll(
        filter,
        page,
        limit
      );

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(
          total / limit
        ),
      },
    };
  }

  async getUserById(id: string) {
    this.validateObjectId(id);

    const user =
      await this.userRepo.findById(id);

    if (!user) {
      throw new UserError(
        'User not found',
        404
      );
    }

    return user;
  }

  async updateUser(
    id: string,
    data: UpdateUserDto
  ) {
    this.validateObjectId(id);

    if (data.mobileNumber) {
      const existingUser =
        await this.userRepo.findByMobileNumber(
          data.mobileNumber
        );

      if (
        existingUser &&
        existingUser._id.toString() !== id
      ) {
        throw new UserError(
          'User with this mobile number already exists',
          409
        );
      }
    }

    if (data.email) {
      const existingEmail =
        await this.userRepo.findByEmail(
          data.email
        );

      if (
        existingEmail &&
        existingEmail._id.toString() !== id
      ) {
        throw new UserError(
          'User with this email already exists',
          409
        );
      }
    }

    const user =
      await this.userRepo.updateById(
        id,
        data
      );

    if (!user) {
      throw new UserError(
        'User not found',
        404
      );
    }

    return user;
  }

  async blockUser(id: string) {
    this.validateObjectId(id);

    const user =
      await this.userRepo.updateById(id, {
        status: 'blocked',
      });

    if (!user) {
      throw new UserError(
        'User not found',
        404
      );
    }

    return user;
  }

  async deleteUser(id: string) {
    this.validateObjectId(id);

    const user =
      await this.userRepo.updateById(id, {
        status: 'deleted',
      });

    if (!user) {
      throw new UserError(
        'User not found',
        404
      );
    }

    return user;
  }

  private parsePositiveNumber(
    value: string | undefined,
    fallback: number
  ) {
    const parsed = Number(value);

    if (
      !value ||
      Number.isNaN(parsed) ||
      parsed < 1
    ) {
      return fallback;
    }

    return Math.floor(parsed);
  }

  private validateObjectId(
    id: string,
    message = 'Invalid user ID'
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      throw new UserError(message);
    }
  }
}
