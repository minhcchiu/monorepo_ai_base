import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dtos';
import { JwtAuthGuard } from '../../common/guards';
import { ApiScope } from '../../common/decorators';
import { FindUserByPhoneDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiScope('app', 'user')
@Controller('user')
export class UserPhoneController {
  constructor(private readonly usersService: UsersService) {}

  @Get('phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user id by phone number' })
  @ApiQuery({ name: 'phone', required: true, description: 'Phone number' })
  @ApiResponse({ status: 200, description: 'User id retrieved successfully' })
  async findUserIdByPhone(
    @Query() query: FindUserByPhoneDto,
  ): Promise<BaseResponseDto<{ userId: string | null }>> {
    const result = await this.usersService.findUserIdByPhone(query.phone);
    return BaseResponseDto.success('User id retrieved successfully', result);
  }
}
