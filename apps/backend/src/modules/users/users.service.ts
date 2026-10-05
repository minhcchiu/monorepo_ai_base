import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  UserListResponseDto,
  QueryUserDto,
} from './dto';
import { PaginationDto, PaginationResponseDto } from '../../common/dtos';
import { AUDIT_ACTIONS } from '../../common/constants';

/**
 * UsersService
 *
 * Handles user management and related operations:
 * - CRUD operations for `User`
 * - Pagination and searching
 * - Soft/hard deletes with audit logs
 *
 * All DB access goes through Prisma and audit logs are created where appropriate.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');

  constructor(
    private prisma: PrismaService,
    private appConfig: AppConfigService,
  ) {}

  /**
   * Get all users with pagination.
   * Excludes soft-deleted users.
   */
  async findAll(query: QueryUserDto): Promise<PaginationResponseDto<UserListResponseDto>> {
    const pagination = new PaginationDto();
    pagination.page = Number(query.page || 1);
    pagination.limit = Number(query.limit || 10);

    const skip = pagination.getSkip();
    const take = pagination.getTake();

    const where: any = { isDeleted: false };
    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.emailVerified !== undefined) where.emailVerified = query.emailVerified;

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
      if (query.toDate) where.createdAt.lte = new Date(query.toDate);
    }

    if (query.keyword) {
      where.OR = [
        { email: { contains: query.keyword, mode: 'insensitive' } },
        { firstName: { contains: query.keyword, mode: 'insensitive' } },
        { lastName: { contains: query.keyword, mode: 'insensitive' } },
        { phone: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    this.logger.log(`Fetched ${users.length} users (total: ${total})`);

    return new PaginationResponseDto(
      users as UserListResponseDto[],
      pagination.page,
      pagination.limit,
      total,
    );
  }

  /**
   * Find a user by id.
   * @throws NotFoundException when the user does not exist or is soft-deleted
   */
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        status: true,
        role: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }

    return user as UserResponseDto;
  }

  /**
   * Find a user by email. Returns null if not found.
   */
  async findByEmail(email: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        status: true,
        role: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user as UserResponseDto | null;
  }

  /**
   * Return the user id for the given phone number, or null if none.
   */
  async findUserIdByPhone(phone: string): Promise<{ userId: string | null }> {
    const user = await this.prisma.user.findFirst({
      where: { phone, isDeleted: false },
      select: { id: true },
    });
    return { userId: user?.id ?? null };
  }

  /**
   * Create a new user (admin flow).
   * - Hashes the password
   * - Writes an audit log inside a transaction
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, firstName, lastName, phone, role } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('User with this email already exists');

    try {
      const hashedPassword = await this.hashPassword(password);
      const user = await this.prisma.executeTransaction(async (prisma) => {
        const newUser = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || null,
            role: role || 'USER',
            status: 'ACTIVE',
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            status: true,
            role: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await prisma.createAuditLog({
          action: AUDIT_ACTIONS.USER_CREATE,
          entityType: 'User',
          entityId: newUser.id,
          userId: newUser.id,
          changes: {
            created: {
              email: newUser.email,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              role: newUser.role,
            },
          },
        });

        return newUser;
      });

      this.logger.log(`User created: ${user.id} (${user.email})`);
      return user as UserResponseDto;
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user and record an audit log.
   * @throws NotFoundException when the user does not exist
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser || existingUser.isDeleted) throw new NotFoundException('User not found');

    try {
      const user = await this.prisma.executeTransaction(async (prisma) => {
        const updatedUser = await prisma.user.update({
          where: { id },
          data: updateUserDto,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            status: true,
            role: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await prisma.createAuditLog({
          action: AUDIT_ACTIONS.USER_UPDATE,
          entityType: 'User',
          entityId: id,
          userId: id,
          changes: { updated: updateUserDto },
        });
        return updatedUser;
      });

      this.logger.log(`User updated: ${user.id}`);
      return user as UserResponseDto;
    } catch (error) {
      this.logger.error('Failed to update user:', error);
      throw error;
    }
  }

  /**
   * Soft-delete a user (set `isDeleted = true` and `deletedAt`).
   * Also creates an audit log entry recording who performed the deletion.
   */
  async softDelete(id: string, deletedById: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) throw new NotFoundException('User not found');

    try {
      await this.prisma.executeTransaction(async (prisma) => {
        await prisma.user.update({
          where: { id },
          data: { isDeleted: true, deletedAt: new Date() },
        });
        await prisma.createAuditLog({
          action: AUDIT_ACTIONS.USER_DELETE,
          entityType: 'User',
          entityId: id,
          userId: deletedById,
          changes: { deleted: { at: new Date().toISOString(), by: deletedById } },
        });
      });
      this.logger.log(`User soft-deleted: ${id}`);
    } catch (error) {
      this.logger.error('Failed to delete user:', error);
      throw error;
    }
  }

  /**
   * Permanently remove a user and related records.
   * Use with caution; this action is irreversible.
   */
  async hardDelete(id: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) throw new NotFoundException('User not found');

    try {
      await this.prisma.executeTransaction(async (prisma) => {
        await prisma.refreshToken.deleteMany({ where: { userId: id } });
        await prisma.auditLog.deleteMany({ where: { userId: id } });
        await prisma.user.delete({ where: { id } });
      });
      this.logger.warn(`User hard-deleted: ${id}`);
    } catch (error) {
      this.logger.error('Failed to hard delete user:', error);
      throw error;
    }
  }

  /**
   * Search users by email or name with pagination.
   */
  async search(
    query: string,
    pagination: PaginationDto,
  ): Promise<PaginationResponseDto<UserListResponseDto>> {
    const skip = pagination.getSkip();
    const take = pagination.getTake();
    const searchQuery = `%${query}%`;

    const [total, users] = await Promise.all([
      this.prisma.user.count({
        where: {
          AND: [
            { isDeleted: false },
            {
              OR: [
                { email: { contains: searchQuery, mode: 'insensitive' } },
                { firstName: { contains: searchQuery, mode: 'insensitive' } },
                { lastName: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
          ],
        },
      }),
      this.prisma.user.findMany({
        where: {
          AND: [
            { isDeleted: false },
            {
              OR: [
                { email: { contains: searchQuery, mode: 'insensitive' } },
                { firstName: { contains: searchQuery, mode: 'insensitive' } },
                { lastName: { contains: searchQuery, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
        skip,
        take,
      }),
    ]);

    return new PaginationResponseDto(
      users as UserListResponseDto[],
      pagination.page,
      pagination.limit,
      total,
    );
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const rounds = this.appConfig.getBcryptRounds();
    return bcrypt.hash(password, rounds);
  }
}
