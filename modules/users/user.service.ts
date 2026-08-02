import mongoose, { QueryFilter } from 'mongoose';
import { IUser, UserStatus } from './user.model';
import { UserRepository } from './user.repository';
import { CreateUserDto, UpdateUserDto, UserListQuery, SaveAddressDto } from './user.types';

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
    const existingUser = await this.userRepo.findByMobileNumber(data.mobileNumber);
    if (existingUser) {
      throw new UserError('User with this mobile number already exists', 409);
    }

    if (data.email) {
      const existingEmail = await this.userRepo.findByEmail(data.email);
      if (existingEmail) {
        throw new UserError('User with this email already exists', 409);
      }
    }

    return this.userRepo.create({ ...data, status: 'active' });
  }

  async getUsers(query: UserListQuery, currentUserId?: string) {
    const page = this.parsePositiveNumber(query.page, 1);
    const limit = Math.min(this.parsePositiveNumber(query.limit, 10), 100);

    const filter: QueryFilter<IUser> = {};
    if (query.name)   filter.name = { $regex: query.name, $options: 'i' };
    if (query.mobile) filter.mobileNumber = query.mobile;
    if (query.email)  filter.email = { $regex: query.email, $options: 'i' };
    if (query.status) filter.status = query.status;
    if (currentUserId) filter._id = { $ne: currentUserId };

    const { items, total } = await this.userRepo.findAll(filter, page, limit);
    return {
      items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserById(id: string) {
    this.validateObjectId(id);
    const user = await this.userRepo.findById(id);
    if (!user) throw new UserError('User not found', 404);
    return user;
  }

  /** GET /profile/me — returns current user's profile including savedAddresses */
  async getMyProfile(userId: string) {
    this.validateObjectId(userId);
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserError('User not found', 404);
    return user;
  }

  /** POST /profile/addresses — save a new address for the current user */
  async saveAddress(userId: string, address: SaveAddressDto) {
    this.validateObjectId(userId);
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UserError('User not found', 404);

    // Cap saved addresses at 5
    if (user.savedAddresses && user.savedAddresses.length >= 5) {
      throw new UserError('Maximum of 5 saved addresses allowed.', 400);
    }

    // Default isDefault to false if not set; make it default if first address
    const isDefault = address.isDefault ?? user.savedAddresses.length === 0;
    const updated = await this.userRepo.addSavedAddress(userId, {
      ...address,
      isDefault,
    });
    if (!updated) throw new UserError('User not found', 404);
    return updated;
  }

  /** DELETE /profile/addresses/:addressId */
  async deleteAddress(userId: string, addressId: string) {
    this.validateObjectId(userId);
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      throw new UserError('Invalid address ID', 400);
    }
    const updated = await this.userRepo.removeSavedAddress(userId, addressId);
    if (!updated) throw new UserError('User not found', 404);
    return updated;
  }

  /** PATCH /profile/addresses/:addressId/default */
  async setDefaultAddress(userId: string, addressId: string) {
    this.validateObjectId(userId);
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      throw new UserError('Invalid address ID', 400);
    }
    const updated = await this.userRepo.setDefaultAddress(userId, addressId);
    if (!updated) throw new UserError('User or address not found', 404);
    return updated;
  }

  async updateUser(id: string, data: UpdateUserDto) {
    this.validateObjectId(id);

    if (data.mobileNumber) {
      const existing = await this.userRepo.findByMobileNumber(data.mobileNumber);
      if (existing && existing._id.toString() !== id) {
        throw new UserError('User with this mobile number already exists', 409);
      }
    }

    if (data.email) {
      const existing = await this.userRepo.findByEmail(data.email);
      if (existing && existing._id.toString() !== id) {
        throw new UserError('User with this email already exists', 409);
      }
    }

    const user = await this.userRepo.updateById(id, data);
    if (!user) throw new UserError('User not found', 404);
    return user;
  }

  async blockUser(id: string) {
    this.validateObjectId(id);
    const user = await this.userRepo.updateById(id, { status: 'blocked' });
    if (!user) throw new UserError('User not found', 404);
    return user;
  }

  async deleteUser(id: string) {
    this.validateObjectId(id);
    const user = await this.userRepo.updateById(id, { status: 'deleted' });
    if (!user) throw new UserError('User not found', 404);
    return user;
  }

  private parsePositiveNumber(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    if (!value || Number.isNaN(parsed) || parsed < 1) return fallback;
    return Math.floor(parsed);
  }

  private validateObjectId(id: string, message = 'Invalid user ID') {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new UserError(message);
    }
  }
}
