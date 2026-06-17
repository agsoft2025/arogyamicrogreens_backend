import mongoose, { Schema, Document } from 'mongoose';

export type UserStatus = 'active' | 'blocked' | 'deleted' | 'suspended';

export interface ISavedAddress {
  _id?: mongoose.Types.ObjectId;
  label?: string;           // e.g. "Home", "Office"
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  name: string;
  email?: string;
  mobileNumber: string;
  isMobileVerified: boolean;
  role: string;
  status: UserStatus;
  savedAddresses: ISavedAddress[];
}

const SavedAddressSchema = new Schema<ISavedAddress>(
  {
    label: { type: String },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      unique: true,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'deleted', 'suspended'],
      default: 'active',
      index: true,
    },
    savedAddresses: {
      type: [SavedAddressSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
