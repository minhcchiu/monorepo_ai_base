import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DashboardOverviewQueryDto,
  DashboardTimeSeriesQueryDto,
  DashboardGroupBy,
} from './dto/dashboard-query.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private buildDateRange(dateFrom?: string, dateTo?: string) {
    const range: any = {};
    if (dateFrom) range.gte = new Date(dateFrom);
    if (dateTo) range.lte = new Date(dateTo);
    return Object.keys(range).length > 0 ? range : undefined;
  }

  private getStartOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private getStartOfMonth() {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Thống kê tổng quan hệ thống (không lọc theo thời gian)
  async getSummary(): Promise<DashboardSummaryDto> {
    const [totalUsers, activeUsers, totalNotifications, unreadNotifications, totalSettings] =
      await Promise.all([
        this.prisma.user.count({ where: { isDeleted: false } }),
        this.prisma.user.count({ where: { isDeleted: false, isActive: true } }),
        this.prisma.notification.count({ where: { deletedAt: null } }),
        this.prisma.notification.count({ where: { deletedAt: null, isRead: false } }),
        this.prisma.systemSetting.count(),
      ]);

    return {
      totalUsers,
      activeUsers,
      totalNotifications,
      unreadNotifications,
      totalSettings,
    };
  }

  // System overview: users, notifications, settings
  async getOverview(query: DashboardOverviewQueryDto) {
    const dateRange = this.buildDateRange(query.dateFrom, query.dateTo);
    const today = this.getStartOfToday();
    const thisMonth = this.getStartOfMonth();

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisMonth,
      usersByRole,
      totalNotifications,
      unreadNotifications,
      totalSettings,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { isDeleted: false, ...(dateRange && { createdAt: dateRange }) },
      }),
      this.prisma.user.count({ where: { isDeleted: false, isActive: true } }),
      this.prisma.user.count({ where: { isDeleted: false, createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { isDeleted: false, createdAt: { gte: thisMonth } } }),
      this.prisma.user.groupBy({ by: ['role'], _count: { id: true }, where: { isDeleted: false } }),
      this.prisma.notification.count({ where: { deletedAt: null } }),
      this.prisma.notification.count({ where: { deletedAt: null, isRead: false } }),
      this.prisma.systemSetting.count(),
    ]);

    const byRole: Record<string, number> = {};
    for (const r of usersByRole) byRole[r.role] = r._count.id;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        newThisMonth: newUsersThisMonth,
        byRole,
      },
      notifications: {
        total: totalNotifications,
        unread: unreadNotifications,
      },
      system: {
        totalSettings,
      },
    };
  }

  // User growth statistics over time
  async getUserStats(query: DashboardTimeSeriesQueryDto) {
    const { groupBy, dateFrom, dateTo } = query;
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const users = await this.prisma.user.findMany({
      where: { isDeleted: false, createdAt: { gte: from, lte: to } },
      select: { createdAt: true, role: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped = this.groupByTime(users, groupBy, (u) => u.createdAt);
    const series = Object.entries(grouped).map(([label, items]) => {
      const byRole: Record<string, number> = {};
      for (const u of items) {
        byRole[u.role] = (byRole[u.role] ?? 0) + 1;
      }
      return { label, total: items.length, byRole };
    });

    const totalNewUsers = users.length;
    const prevMonthStart = new Date(from);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthCount = await this.prisma.user.count({
      where: { isDeleted: false, createdAt: { gte: prevMonthStart, lt: from } },
    });
    const growthRate =
      prevMonthCount > 0
        ? Math.round(((totalNewUsers - prevMonthCount) / prevMonthCount) * 1000) / 10
        : 0;

    return {
      groupBy,
      series,
      summary: { totalNewUsers, growthRateThisMonth: growthRate },
    };
  }

  private groupByTime(
    items: any[],
    groupBy: DashboardGroupBy,
    getDate: (item: any) => Date,
  ): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    for (const item of items) {
      const date = getDate(item);
      let label: string;
      if (groupBy === DashboardGroupBy.DAY) {
        label = date.toISOString().slice(0, 10);
      } else if (groupBy === DashboardGroupBy.WEEK) {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        label = weekStart.toISOString().slice(0, 10);
      } else {
        label = date.toISOString().slice(0, 7);
      }
      if (!result[label]) result[label] = [];
      result[label].push(item);
    }
    return result;
  }
}
