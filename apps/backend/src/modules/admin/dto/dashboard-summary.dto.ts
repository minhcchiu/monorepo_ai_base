import { ApiProperty } from '@nestjs/swagger';

/**
 * DashboardSummaryDto
 *
 * Các con số tổng quan của hệ thống tại thời điểm gọi (không lọc theo thời gian).
 * Base project chỉ thống kê các thực thể lõi — thêm chỉ số nghiệp vụ khi phát sinh.
 */
export class DashboardSummaryDto {
  @ApiProperty({ description: 'Tổng số người dùng (chưa xoá mềm)', example: 128 })
  totalUsers!: number;

  @ApiProperty({ description: 'Số người dùng đang hoạt động', example: 120 })
  activeUsers!: number;

  @ApiProperty({ description: 'Tổng số thông báo', example: 64 })
  totalNotifications!: number;

  @ApiProperty({ description: 'Số thông báo chưa đọc', example: 12 })
  unreadNotifications!: number;

  @ApiProperty({ description: 'Tổng số cấu hình hệ thống', example: 8 })
  totalSettings!: number;
}
