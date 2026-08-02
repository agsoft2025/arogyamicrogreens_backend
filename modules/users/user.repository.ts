import mongoose, { QueryFilter } from 'mongoose';
import User, { IUser } from './user.model';
import { SaveAddressDto } from './user.types';

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

    return { items, total };
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

  async updateById(id: string, data: Partial<IUser>) {
    return User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id: string) {
    return User.findByIdAndDelete(id);
  }

  /** Push a new address to savedAddresses. If isDefault, unset others first. */
  async addSavedAddress(userId: string, address: SaveAddressDto) {
    // Initialise the field for legacy users created before savedAddresses was added to the schema
    await User.updateOne(
      { _id: userId, savedAddresses: { $exists: false } },
      { $set: { savedAddresses: [] } }
    );

    if (address.isDefault) {
      // arrayFilters is safe even when the array is empty — $[] is not
      await User.updateOne(
        { _id: userId },
        { $set: { 'savedAddresses.$[elem].isDefault': false } },
        { arrayFilters: [{ 'elem.isDefault': true }] }
      );
    }

    return User.findByIdAndUpdate(
      userId,
      { $push: { savedAddresses: address } },
      { new: true, runValidators: true }
    );
  }

  /** Remove an address by its subdocument _id */
  async removeSavedAddress(userId: string, addressId: string) {
    return User.findByIdAndUpdate(
      userId,
      { $pull: { savedAddresses: { _id: new mongoose.Types.ObjectId(addressId) } } },
      { new: true }
    );
  }

  /** Set one address as default and clear others */
  async setDefaultAddress(userId: string, addressId: string) {
    // arrayFilters is safe on empty arrays; $[] is not
    await User.updateOne(
      { _id: userId },
      { $set: { 'savedAddresses.$[elem].isDefault': false } },
      { arrayFilters: [{ 'elem.isDefault': true }] }
    );
    return User.findOneAndUpdate(
      { _id: userId, 'savedAddresses._id': new mongoose.Types.ObjectId(addressId) },
      { $set: { 'savedAddresses.$.isDefault': true } },
      { new: true }
    );
  }
}
