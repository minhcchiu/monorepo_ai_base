import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_ACTIONS } from '../../common/constants';
import { QueryUsersDto } from './dto/query-users.dto';
import { AdminCreateUserDto } from './dto/create-user.dto';
import { AdminUpdateUserDto } from './dto/update-user.dto';
import { AdminChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger('AdminUsersService');

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const { page, limit, role, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          status: true,
          emailVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, isDeleted: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: AdminCreateUserDto, adminId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('User with this email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: hashedPassword,
        phone: dto.phone,
        role: (dto.role as any) ?? 'USER',
        status: (dto.status as any) ?? 'ACTIVE',
        emailVerified: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await this.prisma.createAuditLog({
      action: AUDIT_ACTIONS.USER_CREATE,
      entityType: 'User',
      entityId: user.id,
      userId: adminId,
      changes: { email: dto.email, role: dto.role },
    });

    this.logger.log(`Admin ${adminId} created user ${user.id}`);
    return user;
  }

  async update(id: string, dto: AdminUpdateUserDto, adminId: string) {
    await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.role !== undefined && { role: dto.role as any }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await this.prisma.createAuditLog({
      action: AUDIT_ACTIONS.USER_UPDATE,
      entityType: 'User',
      entityId: id,
      userId: adminId,
      changes: dto,
    });

    return updated;
  }

  async remove(id: string, adminId: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    await this.prisma.createAuditLog({
      action: AUDIT_ACTIONS.USER_DELETE,
      entityType: 'User',
      entityId: id,
      userId: adminId,
    });

    this.logger.log(`Admin ${adminId} soft-deleted user ${id}`);
  }

  async changePassword(adminId: string, dto: AdminChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');

    const isValid = await bcrypt.compare(dto.currentPassword, admin.password ?? '');
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: adminId },
      data: { password: hashed },
    });

    await this.prisma.createAuditLog({
      action: AUDIT_ACTIONS.PASSWORD_CHANGE,
      entityType: 'User',
      entityId: adminId,
      userId: adminId,
    });
  }

  async updateProfile(adminId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: adminId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        updatedAt: true,
      },
    });

    await this.prisma.createAuditLog({
      action: AUDIT_ACTIONS.USER_UPDATE,
      entityType: 'User',
      entityId: adminId,
      userId: adminId,
      changes: dto,
    });

    return updated;
  }

  async toggleStatus(id: string, performedById: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';

    await this.prisma.executeTransaction(async (prisma) => {
      await prisma.user.update({ where: { id }, data: { status: newStatus } });
      await prisma.createAuditLog({
        action: AUDIT_ACTIONS.USER_UPDATE,
        entityType: 'User',
        entityId: id,
        userId: performedById,
        changes: { status: newStatus },
      });
    });

    this.logger.log(`Toggled status for user ${id} to ${newStatus}`);
    return { id, status: newStatus };
  }
}
