import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { comparePassword } from '@/common/utils/password.util';
import { AdminUserService } from '../admin-user/admin-user.service';
import { LoginDto } from './dto/login.dto';
import { OperationLogService } from '../operation-log/operation-log.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly adminUserService: AdminUserService,
    private readonly operationLogService: OperationLogService
  ) {}

  async login(dto: LoginDto) {
    const adminUser = await this.adminUserService.findByUsername(dto.username);

    if (!adminUser || adminUser.status !== 'enabled') {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await comparePassword(dto.password, adminUser.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    await this.adminUserService.updateLastLoginAt(adminUser.id);

    const payload = {
      sub: adminUser.id.toString(),
      username: adminUser.username,
      role: adminUser.role
    };

    await this.operationLogService.create({
      adminUserId: adminUser.id.toString(),
      module: 'auth',
      action: 'login',
      targetId: adminUser.id.toString(),
      targetType: 'admin_user',
      content: `管理员 ${adminUser.username} 登录系统`
    });

    return {
      accessToken: await this.jwtService.signAsync(payload),
      adminUser: this.adminUserService.toSafeProfile(adminUser)
    };
  }

  async getProfile(adminId: string) {
    const adminUser = await this.adminUserService.findById(adminId);

    if (!adminUser) {
      throw new UnauthorizedException('登录状态无效');
    }

    return this.adminUserService.toSafeProfile(adminUser);
  }
}
