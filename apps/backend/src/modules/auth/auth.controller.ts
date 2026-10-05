import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  RegisterByPhoneDto,
  RefreshTokenDto,
  CheckPhoneDto,
  RequestOtpDto,
  VerifyOtpDto,
  ChangePasswordDto,
  AuthResponseDto,
  TokenResponseDto,
  LoginByPhoneDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  GuestLoginDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { Public, CurrentUser, CurrentUserId, ApiScope, ApiOkData } from '../../common/decorators';
import { BaseResponseDto } from '../../common/dtos';
import { SUCCESS_MESSAGES } from '../../common/constants';

/**
 * AuthController
 *
 * Handles all authentication endpoints:
 * - POST /auth/register - New user registration
 * - POST /auth/login - User login
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout user
 * - POST /auth/change-password - Change password
 *
 * All endpoints except register and login are protected by JwtGuard.
 */
@Controller('auth')
@ApiTags('auth')
export class AuthController {
  private readonly logger = new Logger('AuthController');

  constructor(private authService: AuthService) {}

  /**
   * Register a new user
   *
   * @param registerDto - User registration data
   * @returns AuthResponseDto with tokens
   *
   * @example
   * POST /auth/register
   * {
   *   "email": "user@example.com",
   *   "password": "SecurePass123!",
   *   "firstName": "John",
   *   "lastName": "Doe"
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "message": "User registered successfully",
   *   "data": {
   *     "accessToken": "...",
   *     "refreshToken": "...",
   *     "user": { ... }
   *   },
   *   "timestamp": "2024-01-20T10:30:00Z"
   * }
   */
  @Public()
  @ApiScope('app', 'user')
  @Post('guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Guest login by deviceId' })
  async guestLogin(@Body() dto: GuestLoginDto): Promise<BaseResponseDto<AuthResponseDto>> {
    this.logger.log(`Guest login for device: ${dto.deviceId}`);
    const result = await this.authService.guestLogin(dto.deviceId);
    return BaseResponseDto.success('Guest session created', result);
  }

  @Public()
  @ApiScope('app', 'user')
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<BaseResponseDto<AuthResponseDto>> {
    this.logger.log(`Register request for: ${registerDto.email}`);
    const result = await this.authService.register(registerDto);
    return BaseResponseDto.success('User registered successfully', result);
  }

  /**
   * Register a new user using phone and password
   * Public endpoint
   */
  @Public()
  @ApiScope('app', 'user')
  @Post('register-by-phone')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register user by phone' })
  async registerByPhone(
    @Body() registerByPhoneDto: RegisterByPhoneDto,
  ): Promise<BaseResponseDto<AuthResponseDto>> {
    this.logger.log(`Register by phone request for: ${registerByPhoneDto.phone}`);
    const result = await this.authService.registerByPhone(registerByPhoneDto);
    return BaseResponseDto.success(SUCCESS_MESSAGES.USER_CREATED, result);
  }

  /**
   * Login user
   *
   * @param loginDto - Email and password
   * @returns AuthResponseDto with tokens
   *
   * @example
   * POST /auth/login
   * {
   *   "email": "phuong@gmail.com",
   *   "password": "Phuong@123"
   * }
   */
  @Public()
  @ApiScope('app', 'admin', 'user')
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkData(AuthResponseDto)
  async login(@Body() loginDto: LoginDto): Promise<BaseResponseDto<AuthResponseDto>> {
    this.logger.log(`Login request for: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    return BaseResponseDto.success(SUCCESS_MESSAGES.LOGIN_SUCCESS, result);
  }

  /**
   * Login user by phone
   * Public endpoint
   */
  @Public()
  @ApiScope('app', 'user')
  @Post('login-by-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone and password' })
  @ApiOkData(AuthResponseDto)
  async loginByPhone(
    @Body() loginByPhoneDto: LoginByPhoneDto,
  ): Promise<BaseResponseDto<AuthResponseDto>> {
    this.logger.log(`Login by phone request for: ${loginByPhoneDto.phone}`);
    const result = await this.authService.loginByPhone(loginByPhoneDto);
    return BaseResponseDto.success(SUCCESS_MESSAGES.LOGIN_SUCCESS, result);
  }

  /**
   * Refresh access token
   *
   * @param refreshTokenDto - Contains refresh token
   * @returns New access token
   *
   * @example
   * POST /auth/refresh
   * {
   *   "refreshToken": "eyJhbGc..."
   * }
   */
  @Public()
  @ApiScope('app', 'admin', 'user')
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkData(TokenResponseDto)
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<BaseResponseDto<TokenResponseDto>> {
    this.logger.log('Token refresh request');
    const result = await this.authService.refreshToken(refreshTokenDto);
    return BaseResponseDto.success('Token refreshed successfully', result);
  }

  /**
   * Test API
   * Public endpoint returning a greeting and list of users
   */
  @Public()
  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test API' })
  async test(): Promise<BaseResponseDto<{ text: string; users: Array<any> }>> {
    const result = await this.authService.test();
    return BaseResponseDto.success('OK', result);
  }

  /**
   * Test endpoint that triggers an unhandled exception to validate Sentry capture
   */
  @Public()
  @Post('test-error')
  @HttpCode(HttpStatus.INTERNAL_SERVER_ERROR)
  @ApiOperation({ summary: 'Trigger test error (Sentry)' })
  async testError(): Promise<void> {
    return this.authService.testError();
  }

  /**
   * Test endpoint that triggers an unhandled exception to validate Sentry capture
   */
  @Public()
  @Post('test-error1')
  @HttpCode(HttpStatus.INTERNAL_SERVER_ERROR)
  @ApiOperation({ summary: 'Trigger test error (Sentry)' })
  async testError1(): Promise<void> {
    return this.authService.testError1();
  }

  /**
   * Check whether a phone number exists in users
   * Public endpoint
   */
  @Public()
  @ApiScope('app', 'user')
  @Post('check-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if phone exists' })
  async checkPhone(@Body() body: CheckPhoneDto): Promise<BaseResponseDto<{ isExist: boolean }>> {
    const result = await this.authService.checkPhone(body.phone);
    return BaseResponseDto.success('OK', result);
  }

  /**
   * Logout user (revoke refresh token)
   *
   * @param refreshToken - Refresh token to revoke
   * @param userId - Current user ID
   *
   * @example
   * POST /auth/logout
   * Authorization: Bearer <access_token>
   * {
   *   "refreshToken": "eyJhbGc..."
   * }
   */
  @UseGuards(JwtAuthGuard)
  @ApiScope('app', 'admin', 'user')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body('refreshToken') refreshToken: string,
    @CurrentUserId() userId: string,
  ): Promise<BaseResponseDto<null>> {
    this.logger.log(`Logout request for user: ${userId}`);
    await this.authService.logout(refreshToken, userId);
    return BaseResponseDto.success(SUCCESS_MESSAGES.LOGOUT_SUCCESS);
  }

  /**
   * Change user password
   *
   * @param userId - Current user ID
   * @param changePasswordDto - Current and new password
   *
   * @example
   * POST /auth/change-password
   * Authorization: Bearer <access_token>
   * {
   *   "currentPassword": "OldPass123!",
   *   "newPassword": "NewPass456!"
   * }
   */
  @UseGuards(JwtAuthGuard)
  @ApiScope('app', 'admin', 'user')
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUserId() userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<BaseResponseDto<null>> {
    this.logger.log(`Password change request for user: ${userId}`);
    await this.authService.changePassword(userId, changePasswordDto);
    return BaseResponseDto.success(SUCCESS_MESSAGES.PASSWORD_CHANGED);
  }

  /**
   * Send OTP to a phone number (public)
   */
  @Public()
  @ApiScope('app', 'user')
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async sendOtp(
    @Body() body: RequestOtpDto,
  ): Promise<BaseResponseDto<{ status: string; expiresAt: string }>> {
    const result = await this.authService.sendOtp(body.phone);
    return BaseResponseDto.success('OK', result);
  }

  /**
   * Verify OTP for a phone number (public)
   */
  @Public()
  @ApiScope('app', 'user')
  @Post('verifer-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for phone' })
  async veriferOtp(@Body() body: VerifyOtpDto): Promise<BaseResponseDto<{ status: boolean }>> {
    const ok = await this.authService.verifyOtp(body.phone, body.otp);
    return BaseResponseDto.success('OK', { status: ok });
  }

  /**
   * Forgot password - gửi OTP về số điện thoại đã đăng ký
   */
  @Public()
  @ApiScope('app', 'admin', 'user')
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to reset password' })
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
  ): Promise<BaseResponseDto<{ status: string; expiresAt: string }>> {
    const result = await this.authService.forgotPassword(body.phone);
    return BaseResponseDto.success(SUCCESS_MESSAGES.PASSWORD_RESET_OTP_SENT, result);
  }

  /**
   * Reset password - xác thực OTP và đặt lại mật khẩu mới
   */
  @Public()
  @ApiScope('app', 'admin', 'user')
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and reset password' })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<BaseResponseDto<null>> {
    await this.authService.resetPassword(body.phone, body.otp, body.newPassword);
    return BaseResponseDto.success(SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS);
  }

  /**
   * Read stored OTPs (public)
   */
  @Public()
  @Get('read-store-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Read in-memory stored OTPs' })
  async readStoreOtp(): Promise<
    BaseResponseDto<{
      otps: Array<{
        phone: string;
        code: string | null;
        createdAt: string;
        expiresAt: string;
        attempts: number;
        lockedUntil?: string | null;
      }>;
    }>
  > {
    const otps = await this.authService.readStoredOtps();
    return BaseResponseDto.success('OK', { otps });
  }
}
