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
