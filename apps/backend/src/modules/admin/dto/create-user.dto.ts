import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminUserRole, AdminUserStatus } from './query-users.dto';

export class AdminCreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: AdminUserRole, default: AdminUserRole.USER })
  @IsOptional()
  @IsEnum(AdminUserRole)
  role?: AdminUserRole;

  @ApiPropertyOptional({ enum: AdminUserStatus, default: AdminUserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(AdminUserStatus)
  status?: AdminUserStatus;
}
