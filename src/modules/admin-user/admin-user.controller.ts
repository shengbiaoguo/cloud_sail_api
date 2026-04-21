import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { IdParamDto } from '@/common/dto/id-param.dto';
import { AdminUserService } from './admin-user.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { QueryAdminUserDto } from './dto/query-admin-user.dto';
import { UpdateAdminPasswordDto } from './dto/update-admin-password.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { CurrentAdmin } from '@/common/decorators/current-admin.decorator';

@ApiTags('Admin Users')
@ApiBearerAuth('bearer')
@Roles('super_admin')
@Controller('admin/admin-users')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  @ApiOperation({ summary: '管理员列表' })
  findAll(@Query() dto: QueryAdminUserDto) {
    return this.adminUserService.findAll(dto);
  }

  @Post()
  @ApiOperation({ summary: '新建管理员' })
  create(@Body() dto: CreateAdminUserDto, @CurrentAdmin('sub') currentAdminId: string) {
    return this.adminUserService.create(dto, currentAdminId);
  }

  @Get(':id')
  @ApiOperation({ summary: '管理员详情' })
  findOne(@Param() params: IdParamDto) {
    return this.adminUserService.findOne(params.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新管理员信息' })
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateAdminUserDto,
    @CurrentAdmin('sub') currentAdminId: string
  ) {
    return this.adminUserService.update(params.id, dto, currentAdminId);
  }

  @Patch(':id/password')
  @ApiOperation({ summary: '修改管理员密码' })
  updatePassword(
    @Param() params: IdParamDto,
    @Body() dto: UpdateAdminPasswordDto,
    @CurrentAdmin('sub') currentAdminId: string
  ) {
    return this.adminUserService.updatePassword(params.id, dto, currentAdminId);
  }
}
