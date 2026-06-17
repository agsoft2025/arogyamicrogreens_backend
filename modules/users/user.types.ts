import { UserStatus } from './user.model';

export type CreateUserDto = {
  name: string;
  email?: string;
  mobileNumber: string;
  role?: string;
};

export type UpdateUserDto = Partial<{
  name: string;
  email: string;
  mobileNumber: string;
  role: string;
  status: UserStatus;
  isMobileVerified: boolean;
}>;

export type SaveAddressDto = {
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
};

export type UserListQuery = {
  page?: string;
  limit?: string;
  name?: string;
  mobile?: string;
  email?: string;
  status?: UserStatus;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UserListResponse = {
  items: any[];
  pagination: PaginationMeta;
};
