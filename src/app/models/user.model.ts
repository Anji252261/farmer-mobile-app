export type Role = 'MAIN_OWNER' | 'SUB_OWNER';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  shopName?: string;
  role: Role;
  token?: string;
}

export interface CreateSubOwnerPayload {
  name: string;
  phone: string;
  shopName: string;
  email?: string;
}

export interface UpdateSubOwnerPayload {
  name: string;
  phone: string;
  shopName: string;
  email?: string;
  password?: string;
}

export interface CreateSubOwnerResult {
  user: User;
  tempPassword?: string;
}

export interface ApiUser extends Partial<User> {
  _id?: string;
}
