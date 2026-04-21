import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminUserService } from '../admin-user/admin-user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly adminUserService: AdminUserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret')
    });
  }

  async validate(payload: { sub: string; username: string; role: string }) {
    const adminUser = await this.adminUserService.findById(payload.sub);

    if (!adminUser || adminUser.status !== 'enabled') {
      throw new UnauthorizedException('登录状态无效');
    }

    return {
      sub: adminUser.id.toString(),
      username: adminUser.username,
      role: adminUser.role,
      nickname: adminUser.nickname
    };
  }
}
