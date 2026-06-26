export interface LoginRequest {
  readonly username: string;
  readonly password: string;
}
export interface LoginResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn?: number;
}
export interface RefreshRequest {
  readonly refreshToken: string;
}
export interface JwtPayload {
  readonly sub: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly exp: number;
}
