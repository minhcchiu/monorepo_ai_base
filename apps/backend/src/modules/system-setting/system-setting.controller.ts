import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { SystemSettingService } from './system-setting.service';
import { CreateSystemSettingDto } from './dto/create-system-setting.dto';
import { UpdateSystemSettingDto } from './dto/update-system-setting.dto';
import { QuerySystemSettingDto } from './dto/query-system-setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('SystemSetting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('system-setting')
export class SystemSettingController {
  constructor(private readonly service: SystemSettingService) {}

  @Post()
  @ApiOperation({ summary: 'Create system setting' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiBody({ type: CreateSystemSettingDto })
  create(@Body() dto: CreateSystemSettingDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List system settings' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query() query: QuerySystemSettingDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get system setting by id' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update system setting' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateSystemSettingDto })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateSystemSettingDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete system setting' })
  @ApiParam({ name: 'id' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.remove(id);
  }
}
