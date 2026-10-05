import {
  IsEmail,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  MinLength,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * CreateUserDto
 *
 * DTO for creating a new user (admin endpoint).
 * Includes password which will be hashed before storing.
 */
export class CreateUserDto {
  @ApiProperty({ required: false, description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ required: false, description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsOptional()
  @IsEnum(['USER', 'MODERATOR', 'ADMIN'])
  role?: string;

  @ApiProperty({ required: false, description: 'Whether the user is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, description: 'Created at timestamp' })
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @ApiProperty({ required: false, description: 'Updated at timestamp' })
  @IsOptional()
  @IsDateString()
  updatedAt?: string;

  @ApiProperty({ required: false, description: 'Deleted at timestamp (soft delete)' })
  @IsOptional()
  @IsDateString()
  deletedAt?: string | null;
}

/**
 * UpdateUserDto
 *
 * DTO for updating user information.
 * Excludes password (use change-password endpoint instead).
 * All fields are optional.
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'First name', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', minLength: 2 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
    description: 'User status',
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'])
  status?: string;

  @ApiPropertyOptional({ description: 'Whether the user is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Deleted at timestamp (soft delete)' })
  @IsOptional()
  @IsDateString()
  deletedAt?: string | null;
}

/**
 * UserResponseDto
 *
 * Safe user data to return in responses.
 * Excludes sensitive fields like password, emailVerificationToken.
 */
export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  avatar?: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty()
  role!: string;

  @ApiProperty({ required: false })
  emailVerified?: boolean;

  @ApiProperty({ required: false })
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ required: false, description: 'Soft delete timestamp' })
  deletedAt?: Date | null;

  @ApiProperty({ required: false, description: 'Whether the user is active' })
  isActive?: boolean;
}

/**
 * UserListResponseDto
 *
 * User data for list endpoints.
 * Same as UserResponseDto, slightly more minimal.
 */
export class UserListResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty()
  role!: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  lastLoginAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date | null;

  @ApiProperty({ required: false, description: 'Whether the user is active' })
  isActive?: boolean;
}
