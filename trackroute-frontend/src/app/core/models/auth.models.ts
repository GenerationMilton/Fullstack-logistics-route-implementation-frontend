export type UserRole = 'ADMIN' | 'OPERATOR';

export interface AuthUser {
  sub?: string;
  username: string;
  role: UserRole;
  exp?: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}
