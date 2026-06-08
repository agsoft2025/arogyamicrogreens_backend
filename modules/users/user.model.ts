import mongoose, { Schema, Document } from 'mongoose';

export type UserStatus = 'active' | 'blocked' | 'deleted' | 'suspended';

export interface IUser extends Document {
  name: string;
  email?: string;
  mobileNumber: string;
  isMobileVerified: boolean;
  role: string;
  status: UserStatus;
}

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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
