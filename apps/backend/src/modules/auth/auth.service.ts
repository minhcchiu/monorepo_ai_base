import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import {
  LoginDto,
  RegisterDto,
  RegisterByPhoneDto,
  LoginByPhoneDto,
  RefreshTokenDto,
  AuthResponseDto,
  TokenResponseDto,
  JwtPayloadDto,
  ChangePasswordDto,
} from './dto';
import { AUDIT_ACTIONS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../../common/constants';

/**
 * AuthService
 *
 * Handles all authentication-related operations:
 * - User login and logout
 * - User registration
 * - JWT token generation and refresh
 * - Password hashing and verification
 * - Token revocation
 *
 * IMPORTANT SECURITY NOTES:
 * - Never return plain passwords
 * - Always hash passwords with bcrypt
 * - Use secure JWT secrets
 * - Implement token rotation
 * - Log all authentication events
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  // In-memory OTP store: phone -> { code, expiresAt, createdAt, attempts, lockedUntil }
  // This is an ephemeral store; for production use Redis with TTL and rate-limiting.
  private otpStore: Map<
    string,
    {
      code: string | null;
      expiresAt: Date;
      createdAt: Date;
      attempts: number;
      lockedUntil?: Date | null;
    }
  > = new Map();

  // Security controls
  private readonly MAX_OTP_ATTEMPTS = 5;
  private readonly LOCKOUT_MINUTES = 15;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private appConfig: AppConfigService,
  ) {}

  /**
   * Register a new user
   *
   * @param registerDto - User registration data
   * @returns AuthResponseDto with tokens and user info
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, phone } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed: Email ${email} already exists`);
      throw new ConflictException(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }

    try {
      // Hash password with bcrypt
      const hashedPassword = await this.hashPassword(password);

      // Create new user (wrapped in transaction for data consistency)
      const user = await this.prisma.executeTransaction(async (prisma) => {
        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || null,
            status: 'ACTIVE', // Or 'PENDING_VERIFICATION' depending on your flow
            emailVerified: false,
          },
        });

        // Create audit log for registration
        await prisma.createAuditLog({
          action: AUDIT_ACTIONS.USER_CREATE,
          entityType: 'User',
          entityId: newUser.id,
          userId: newUser.id, // Self-registration
          changes: {
            created: {
              email: newUser.email,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
            },
          },
        });

        return newUser;
      });

      this.logger.log(`User registered: ${user.id} (${user.email})`);

      // Generate tokens
      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Registration failed:', error);
      throw new BadRequestException(ERROR_MESSAGES.INVALID_INPUT);
    }
  }

  /**
   * Register a user by phone and password (public flow)
   * No DB transaction and no audit log as per requirements
   */
  async registerByPhone(registerByPhoneDto: RegisterByPhoneDto): Promise<AuthResponseDto> {
    const { phone, password } = registerByPhoneDto;

    if (!phone || !password) {
      throw new BadRequestException('Phone and password are required');
    }

    // Check existing user by phone
    const existing = await this.prisma.user.findFirst({
      where: { phone, isDeleted: false },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('User with this phone already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user (no transaction, no audit)
    const user = await this.prisma.user.create({
      data: {
        email: `${phone}@phone.local`,
        password: hashedPassword,
        phone,
        firstName: '',
        lastName: '',
        status: 'ACTIVE',
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    this.logger.log(`User registered by phone: ${user.id} (${phone})`);

    // Generate tokens so client doesn't need to login separately
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Login user by phone and password
   * Public flow, no audit log, no transaction
   */
  async loginByPhone(loginByPhoneDto: LoginByPhoneDto): Promise<AuthResponseDto> {
    const { phone, password } = loginByPhoneDto;

    // Find user by phone
    const user = await this.prisma.user.findFirst({
      where: { phone, isDeleted: false },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user || !user.password) {
      this.logger.warn(`Login by phone failed: User not found or no password - ${phone}`);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (user.status === 'SUSPENDED') {
      this.logger.warn(`Login by phone failed: User suspended - ${phone}`);
      throw new UnauthorizedException('User account is suspended');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login by phone failed: Invalid password - ${phone}`);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login timestamp asynchronously
    this.prisma.user
      .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
      .catch((e) => this.logger.error('Failed to update lastLoginAt:', e));

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * User login
   *
   * @param loginDto - Email and password
   * @returns AuthResponseDto with tokens and user info
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      this.logger.warn(`Login failed: User not found or no password - ${email}`);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if user is active
    if (user.status === 'SUSPENDED') {
      this.logger.warn(`Login failed: User suspended - ${email}`);
      throw new UnauthorizedException('User account is suspended');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password - ${email}`);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login timestamp (async, non-blocking)
    this.prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })
      .catch((error) => {
        this.logger.error('Failed to update lastLoginAt:', error);
      });

    // Create audit log for login
    await this.prisma.createAuditLog({
      action: AUDIT_ACTIONS.LOGIN,
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
    });

    this.logger.log(`User logged in: ${user.id} (${user.email})`);

    // Generate tokens
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshTokenDto - Contains the refresh token
   * @returns New access token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<TokenResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: this.appConfig.getJwtSecret(),
      });

      // Check if refresh token exists in database and is not revoked
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshTokenDto.refreshToken },
      });

      if (!storedToken || storedToken.revoked) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      if (new Date() > storedToken.expiresAt) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const newAccessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        {
          secret: this.appConfig.getJwtSecret(),
          expiresIn: this.appConfig.getJwtAccessTokenExpires() as any,
        },
      );

      // Create audit log
      await this.prisma.createAuditLog({
        action: AUDIT_ACTIONS.TOKEN_REFRESH,
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
      });

      return {
        accessToken: newAccessToken,
        expiresIn: this.appConfig.getJwtAccessTokenExpires(),
      };
    } catch (error: any) {
      this.logger.warn('Token refresh failed:', error?.message || error);
      throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_EXPIRED);
    }
  }

  /**
   * Logout user by revoking refresh token
   *
   * @param refreshToken - Token to revoke
   * @param userId - User ID for logging
   */
  async logout(refreshToken: string, userId: string): Promise<void> {
    try {
      await this.prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { revoked: true },
      });

      // Create audit log
      await this.prisma.createAuditLog({
        action: AUDIT_ACTIONS.LOGOUT,
        entityType: 'User',
        entityId: userId,
        userId: userId,
      });

      this.logger.log(`User logged out: ${userId}`);
    } catch (error: any) {
      this.logger.warn('Logout failed:', error?.message || error);
      // Don't throw error on logout failure - it's not critical
    }
  }

  /**
   * Change user password
   *
   * @param userId - User ID
   * @param changePasswordDto - Current and new password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await this.comparePassword(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Create audit log
    await this.prisma.createAuditLog({
      action: AUDIT_ACTIONS.PASSWORD_CHANGE,
      entityType: 'User',
      entityId: userId,
      userId: userId,
    });

    this.logger.log(`Password changed: ${userId}`);
  }

  /**
   * Test helper returning a greeting and list of users (safe fields only)
   */
  async test(): Promise<{ text: string; users: Array<any> }> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    return { text: 'Hello world', users };
  }

  /**
   * Test method that throws an error to verify Sentry capture
   */
  async testError(): Promise<void> {
    this.logger.log('Invoking testError to throw controlled exception');
    // Throw a plain Error to exercise global exception filters and Sentry
    throw new Error('Sentry test error from AuthService');
  }

  /**
   * Test method that throws an error to verify Sentry capture
   */
  async testError1(): Promise<void> {
    this.logger.log('Invoking testError to throw controlled exception');
    // Throw a plain Error to exercise global exception filters and Sentry
    throw new Error('Sentry test error from AuthService1');
  }

  /**
   * Initiate forgot-password flow: validate phone belongs to a user, then send OTP.
   */
  async forgotPassword(phone: string): Promise<{ status: string; expiresAt: string }> {
    const normalizedPhone = this.normalizeVietnamPhone(phone);

    const user = await this.prisma.user.findFirst({
      where: { phone: normalizedPhone, isDeleted: false },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Số điện thoại không tồn tại trong hệ thống');
    }

    return this.sendOtp(phone);
  }

  /**
   * Complete forgot-password flow: verify OTP and update password.
   */
  async resetPassword(phone: string, otp: string, newPassword: string): Promise<void> {
    const isValid = await this.verifyOtp(phone, otp);

    if (!isValid) {
      throw new BadRequestException('OTP không hợp lệ hoặc đã hết hạn');
    }

    const normalizedPhone = this.normalizeVietnamPhone(phone);

    const user = await this.prisma.user.findFirst({
      where: { phone: normalizedPhone, isDeleted: false },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.prisma.createAuditLog({
      action: AUDIT_ACTIONS.PASSWORD_RESET,
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
    });

    this.logger.log(`Password reset via OTP for user: ${user.id}`);
  }

  /**
   * Check if a phone number exists for any user
   *
   * @param phone - Phone number to check
   */
  async checkPhone(phone: string): Promise<{ isExist: boolean }> {
    if (!phone) {
      return { isExist: false };
    }

    const user = await this.prisma.user.findFirst({
      where: { phone, isDeleted: false },
      select: { id: true },
    });

    return { isExist: !!user };
  }

  /**
   * Send OTP to a phone number and store it temporarily for verification
   * No DB transaction — OTPs are stored in-memory (ephemeral)
   */
  async sendOtp(phone: string): Promise<{ status: string; expiresAt: string }> {
    if (!phone) {
      return { status: 'INVALID_PHONE', expiresAt: null } as any;
    }

    const normalizedPhone = this.normalizeVietnamPhone(phone);

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000); // 5 minutes

    this.otpStore.set(normalizedPhone, {
      code,
      expiresAt,
      createdAt,
      attempts: 0,
      lockedUntil: null,
    });

    try {
      await this.sendOtpViaEsms(normalizedPhone, code);
    } catch (error: any) {
      this.otpStore.delete(normalizedPhone);
      this.logger.error(`Failed to send OTP to ${normalizedPhone}: ${error?.message || error}`);
      throw new BadRequestException('Unable to send OTP at this time');
    }

    this.logger.log(`OTP sent to ${normalizedPhone} (expires ${expiresAt.toISOString()})`);

    return { status: 'OTP_SENT', expiresAt: expiresAt.toISOString() };
  }

  /**
   * Return all OTPs currently stored in memory, newest first.
   * Public debugging helper (non-sensitive in this implementation).
   */
  async readStoredOtps(): Promise<
    Array<{
      phone: string;
      code: string | null;
      createdAt: string;
      expiresAt: string;
      attempts: number;
      lockedUntil?: string | null;
    }>
  > {
    const items: Array<{
      phone: string;
      code: string | null;
      createdAt: Date;
      expiresAt: Date;
      attempts: number;
      lockedUntil?: Date | null;
    }> = [];

    for (const [phone, rec] of this.otpStore.entries()) {
      items.push({
        phone,
        code: rec.code,
        createdAt: rec.createdAt,
        expiresAt: rec.expiresAt,
        attempts: rec.attempts,
        lockedUntil: rec.lockedUntil,
      });
    }

    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return items.map((i) => ({
      phone: i.phone,
      code: i.code,
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
      attempts: i.attempts,
      lockedUntil: i.lockedUntil ? i.lockedUntil.toISOString() : null,
    }));
  }

  /**
   * Verify OTP for a phone number.
   * Returns true if valid, false otherwise. Consumes the OTP on success or expiration.
   */
  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const normalizedPhone = this.normalizeVietnamPhone(phone);
    const record = this.otpStore.get(normalizedPhone);
    if (!record) return false;

    const now = new Date();

    // If locked due to too many attempts
    if (record.lockedUntil && now < record.lockedUntil) {
      return false;
    }

    // Expired
    if (now > record.expiresAt) {
      this.otpStore.delete(normalizedPhone);
      return false;
    }

    const isMatch = record.code === otp;

    if (isMatch) {
      // Successful verification - consume OTP
      this.otpStore.delete(normalizedPhone);
      return true;
    }

    // Failed attempt: increment counter and apply lockout if exceeded
    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts >= this.MAX_OTP_ATTEMPTS) {
      // Lock out and clear the OTP code to require a new send
      record.lockedUntil = new Date(now.getTime() + this.LOCKOUT_MINUTES * 60 * 1000);
      record.code = null;
      record.attempts = 0;
    }

    this.otpStore.set(normalizedPhone, record);
    return false;
  }

  private normalizeVietnamPhone(phone: string): string {
    const digits = (phone || '').replace(/\s|-|\./g, '');
    if (digits.startsWith('+84')) {
      return `0${digits.slice(3)}`;
    }
    if (digits.startsWith('84') && digits.length >= 10) {
      return `0${digits.slice(2)}`;
    }
    return digits;
  }

  private async sendOtpViaEsms(phone: string, otp: string): Promise<void> {
    const apiKey = this.appConfig.getEsmsApiKey();
    const secretKey = this.appConfig.getEsmsSecretKey();
    const oaid = this.appConfig.getEsmsOaId();
    const tempId = this.appConfig.getEsmsTempId();

    if (!apiKey || !secretKey || !oaid || !tempId) {
      throw new BadRequestException('OTP provider configuration is missing');
    }

    const payload = {
      ApiKey: apiKey,
      SecretKey: secretKey,
      OAID: oaid,
      Phone: phone,
      TempData: {
        otp,
      },
      TempID: tempId,
      SendingMode: this.appConfig.getEsmsSendingMode() || '1',
      CallbackUrl: this.appConfig.getEsmsCallbackUrl(),
    };

    const response = await fetch(this.appConfig.getEsmsEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}) as any);

    if (!response.ok) {
      throw new BadRequestException(`OTP provider HTTP ${response.status}`);
    }

    const codeResult = data?.CodeResult ?? data?.codeResult;
    if (codeResult !== undefined && String(codeResult) !== '100') {
      throw new BadRequestException(
        data?.ErrorMessage || data?.errorMessage || 'OTP provider rejected request',
      );
    }
  }

  /**
   * Hash password using bcrypt
   *
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const rounds = this.appConfig.getBcryptRounds?.() ?? 10;
    return bcrypt.hash(password, rounds);
  }

  /**
   * Compare plain text password with hashed password
   *
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if passwords match
   */
  private async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Guest login — POST /auth/guest
   * Tạo hoặc dùng lại tài khoản khách gắn với deviceId (KHÔNG cần email/password).
   */
  async guestLogin(deviceId: string): Promise<AuthResponseDto> {
    const guestEmail = `guest_${deviceId}@guest.internal`;

    let user = await this.prisma.user.findUnique({ where: { email: guestEmail } });

    if (user && user.password) {
      // Email khách bị "chiếm" bởi một lượt đăng ký thật (user thật LUÔN có password) —
      // không tái dùng account đó, tránh trả token cho đúng thiết bị nhưng SAI account.
      throw new UnauthorizedException('Guest session unavailable for this device');
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: guestEmail,
          firstName: 'Guest',
          lastName: 'User',
          status: 'ACTIVE',
          emailVerified: false,
        },
      });
      this.logger.log(`Guest account created: ${user.id} (device: ${deviceId})`);
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Generate both access and refresh tokens
   *
   * @param payload - JWT payload
   * @returns Access and refresh tokens
   */
  private async generateTokens(payload: JwtPayloadDto) {
    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.appConfig.getJwtSecret(),
      expiresIn: this.appConfig.getJwtAccessTokenExpires() as any,
    });

    // Generate refresh token (long-lived)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.appConfig.getJwtSecret(),
      expiresIn: this.appConfig.getJwtRefreshTokenExpires() as any,
    });

    // Store refresh token in database with expiration
    const expiresIn = parseInt(this.appConfig.getJwtRefreshTokenExpires().match(/\d+/)?.[0] || '7');
    const expiresAt = new Date();
    if (this.appConfig.getJwtRefreshTokenExpires().includes('d')) {
      expiresAt.setDate(expiresAt.getDate() + expiresIn);
    } else if (this.appConfig.getJwtRefreshTokenExpires().includes('h')) {
      expiresAt.setHours(expiresAt.getHours() + expiresIn);
    }

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        expiresAt,
        userId: payload.sub,
      },
    });

    return { accessToken, refreshToken };
  }
}
