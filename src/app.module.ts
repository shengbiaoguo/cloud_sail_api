import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { RequestContextMiddleware } from './common/request-context/request-context.middleware';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { NewsModule } from './modules/news/news.module';
import { CaseStudyModule } from './modules/case-study/case-study.module';
import { ServiceModule } from './modules/service/service.module';
import { SiteConfigModule } from './modules/site-config/site-config.module';
import { LeadModule } from './modules/lead/lead.module';
import { UploadModule } from './modules/upload/upload.module';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { pinoHttpConfig } from './common/logger/pino-http.config';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: pinoHttpConfig
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema
    }),
    PrismaModule,
    AuthModule,
    AdminUserModule,
    NewsModule,
    CaseStudyModule,
    ServiceModule,
    SiteConfigModule,
    LeadModule,
    UploadModule,
    OperationLogModule,
    DashboardModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    },
    AllExceptionsFilter
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
