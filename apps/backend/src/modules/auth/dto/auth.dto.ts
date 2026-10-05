import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * GuestLoginDto — POST /auth/guest
 * Tạo/dùng lại tài khoản khách gắn với deviceId, cho phép trải nghiệm app trước khi
 * đăng ký thật.
 */
export class GuestLoginDto {
  @ApiProperty({ example: 'device-uuid-abc123' })
  @IsString()
  deviceId: string;
}

/**
 * LoginDto
 *
 * Data Transfer Object for user login.
 * Validates email and password format.
 *
 * @example
 * POST /auth/login
 * {
 *   "email": "user1@example.com",
 *   "password": "SecurePassword123!"
 * }
 */
export class LoginDto {
  @ApiProperty({ example: 'phuong@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Phuong@123' })
  @IsString()
  @MinLength(8)
  password: string;
}

/**
 * RegisterDto
 *
 * Data Transfer Object for user registration.
 * Validates email, password strength, and user details.
 *
 * Password Requirements:
 * - Minimum 8 characters
 * - At least 1 lowercase letter
 * - At least 1 uppercase letter
 * - At least 1 number
 * - Special characters allowed but not required
 *
 * @example
 * POST /auth/register
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "firstName": "John",
 *   "lastName": "Doe"
 * }
 */
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must contain at least 1 lowercase letter, 1 uppercase letter, and 1 number',
  })
  password: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

/**
 * RefreshTokenDto
 *
 * Data Transfer Object for token refresh.
 * Contains the refresh token to obtain a new access token.
 *
 * @example
 * POST /auth/refresh
 * {
 *   "refreshToken": "eyJhbGc..."
 * }
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

/**
 * ChangePasswordDto
 *
 * Data Transfer Object for changing password.
 *
 * @example
 * POST /auth/change-password
 * {
 *   "currentPassword": "OldPass123!",
 *   "newPassword": "NewPass456!"
 * }
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must contain at least 1 lowercase letter, 1 uppercase letter, and 1 number',
  })
  newPassword: string;
}

/**
 * AuthResponseDto
 *
 * Response format for authentication endpoints.
 *
 * @example
 * {
 *   "accessToken": "eyJhbGc...",
 *   "refreshToken": "eyJhbGc...",
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "firstName": "John",
 *     "lastName": "Doe",
 *     "role": "USER"
 *   }
 * }
 */
export class AuthUserDto {
  @ApiProperty() id!: string;
  @ApiProperty({ required: false }) email?: string;
  @ApiProperty({ required: false }) firstName?: string;
  @ApiProperty({ required: false }) lastName?: string;
  @ApiProperty() role!: string;
}

export class AuthResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty({ type: AuthUserDto }) user!: AuthUserDto;
}

/**
 * TokenResponseDto
 *
 * Simple token response for refresh endpoint.
 */
export class TokenResponseDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() expiresIn!: string;
}

/**
 * JwtPayloadDto
 *
 * JWT token payload structure.
 * This is what gets encoded in the JWT.
 */
export class JwtPayloadDto {
  sub: string; // user ID
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat?: number; // issued at
  exp?: number; // expiration time
}

/**
 * RequestOtpDto
 *
 * POST /auth/request-otp
 */
export class RequestOtpDto {
  @ApiProperty({ example: '+84901234567' })
  @IsString()
  phone: string;
}

/**
 * VerifyOtpDto
 *
 * POST /auth/verify-otp
 */
export class VerifyOtpDto {
  @ApiProperty({ example: '+84901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}

/**
 * CheckPhoneDto
 *
 * POST /auth/check-phone
 */
export class CheckPhoneDto {
  @ApiProperty({ example: '+84901234567' })
  @IsString()
  phone: string;
}

/**
 * LoginByPhoneDto
 *
 * DTO for logging in with phone and password.
 */
export class LoginByPhoneDto {
  @ApiProperty({ example: '+84901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;
}

/**
 * RegisterByPhoneDto
 *
 * Data Transfer Object for registering a user using phone and password.
 */
export class RegisterByPhoneDto {
  @ApiProperty({ example: '+84901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must contain at least 1 lowercase letter, 1 uppercase letter, and 1 number',
  })
  password: string;
}

/**
 * ForgotPasswordDto
 *
 * POST /auth/forgot-password
 * Gửi OTP về số điện thoại để đặt lại mật khẩu.
 */
export class ForgotPasswordDto {
  @ApiProperty({ example: '+84901234567' })
  @IsString()
  phone: string;
}

/**
 * ResetPasswordDto
 *
 * POST /auth/reset-password
 * Xác thực OTP và đặt lại mật khẩu mới.
 */
export class ResetPasswordDto {
  @ApiProperty({ example: '+84901234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'NewPass123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must contain at least 1 lowercase letter, 1 uppercase letter, and 1 number',
  })
  newPassword: string;
}
