# Cloud Sail API 服务端

`cloud_sail_api` 是 Cloud Sail 项目的 API 服务端，面向两类调用方：

- 官网前台：内容查询、站点配置读取、线索提交
- CMS 管理后台：登录鉴权、内容管理、线索管理、站点配置、上传、操作日志

当前项目以中小型企业官网 / CMS 场景为目标，优先保证：

- 模块边界清晰
- NestJS 结构规范
- MySQL 数据模型合理
- 易于维护与后续扩展
- 适合 Ubuntu + Nginx + PM2 部署

## 技术栈

- NestJS 10
- TypeScript
- Prisma
- MySQL
- JWT 鉴权
- class-validator / class-transformer
- Swagger
- Redis
  - 当前仅保留配置位，尚未深入接入业务

## 当前已完成模块

- `auth`
  - 管理员登录
  - 获取当前管理员信息
- `admin-user`
  - 管理员列表、创建、更新、改密码
- `news`
  - 后台 CRUD / 发布 / 下线
  - 前台列表 / 详情
- `case-study`
  - 后台 CRUD / 发布 / 下线
  - 前台列表 / 详情
- `service`
  - 后台 CRUD / 发布 / 下线
  - 前台列表 / 详情
- `site-config`
  - 后台读取与批量更新
  - 前台聚合读取
- `lead`
  - 前台提交线索
  - 后台查询、改状态、改备注
- `upload`
  - 图片上传
  - 上传记录查询
  - 已按“可切换存储实现”设计，当前为本地存储
- `operation-log`
  - 后台关键操作写入
  - 日志列表 / 详情查询

## 目录结构

```text
cloud_sail_api/
  docs/
    api-architecture.md
  prisma/
    migrations/
    schema.prisma
    seed.ts
    seed.utils.ts
  src/
    app.module.ts
    main.ts
    common/
    config/
    database/
    modules/
      auth/
      admin-user/
      news/
      case-study/
      service/
      site-config/
      lead/
      upload/
      operation-log/
  .env
  .env.example
  package.json
  prisma.config.ts
```

## 设计说明

### 接口边界

- `/api/auth/*`
  - 认证相关接口
- `/api/admin/*`
  - 后台管理接口
- `/api/web/*`
  - 官网前台公开接口

### 分层职责

- `Controller`
  - 负责路由入口、DTO 绑定、参数接收
- `Service`
  - 负责业务逻辑、状态流转、权限规则
- `PrismaService`
  - 负责数据库访问
- `common`
  - 负责全局守卫、过滤器、拦截器、装饰器、通用 DTO

### 统一能力

- 全局响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

- 全局异常处理
- 全局参数校验
- JWT 全局守卫
- 角色守卫
- BigInt 自动转字符串
- Date 自动转 ISO 字符串

## 数据库说明

ORM 选型为 `Prisma`，原因：

- Schema 清晰
- 类型推导体验好
- 迁移更稳定
- 更适合当前以 CRUD 为主的 CMS/API 场景

数据库核心表：

- `admin_user`
- `news`
- `case_study`
- `service`
- `lead`
- `site_config`
- `upload_file`
- `operation_log`

## 环境要求

- Node.js `>= 20.10.0`
- MySQL 8.x
- npm / pnpm 均可

建议本地使用 Node 20 或 Node 22。

## 环境变量

参考 `.env.example`：

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="mysql://root:password@127.0.0.1:3306/cloud_sail_api"

JWT_SECRET=replace_me
JWT_EXPIRES_IN=7d

UPLOAD_STORAGE=local
UPLOAD_DIR=F:/workspace/topedit_v2/cloud_sail/upload_imgs
UPLOAD_BASE_URL=/upload_imgs

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
```

### 上传相关说明

当前上传模块使用本地存储实现，默认配置为：

- 存储类型：`local`
- 本地目录：`F:/workspace/topedit_v2/cloud_sail/upload_imgs`
- 访问前缀：`/upload_imgs`

项目启动后会把 `UPLOAD_DIR` 以静态资源方式挂载到 `UPLOAD_BASE_URL`。

例如上传后的文件 URL 可能类似：

```text
/upload_imgs/images/2026/04/21/xxxxxxxx.jpg
```

### 存储扩展说明

上传模块已按可替换存储实现设计：

- 抽象接口：`src/modules/upload/storage/upload-storage.interface.ts`
- 当前实现：`src/modules/upload/storage/local-upload.storage.ts`

后续如果切换 OSS / COS / S3，原则上只需要：

1. 新增一个存储实现
2. 在 `upload.module.ts` 中切换 provider
3. 保持 `UploadService` 不变

## 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 创建数据库

手动创建数据库，例如：

```sql
CREATE DATABASE cloud_sail_api DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 配置 `.env`

复制 `.env.example` 并填好数据库连接、JWT 密钥等配置。

### 4. 执行迁移

```bash
npm run prisma:migrate:deploy
```

### 5. 初始化种子数据

```bash
npm run prisma:seed
```

### 6. 启动开发环境

```bash
npm run start:dev
```

### 7. 访问 Swagger

```text
http://localhost:3000/api/docs
```

## 默认管理员

执行 `npm run prisma:seed` 后，如果未额外配置种子环境变量，默认会创建一个超级管理员：

- 用户名：`admin`
- 密码：`Admin@123456`

如需自定义，可在执行 seed 前设置：

- `SEED_SUPER_ADMIN_USERNAME`
- `SEED_SUPER_ADMIN_PASSWORD`
- `SEED_SUPER_ADMIN_NICKNAME`

## 常用命令

```bash
npm run start:dev
npm run build
npm run prisma:generate
npm run prisma:migrate:deploy
npm run prisma:seed
npm run prisma:studio
```

## Swagger 联调说明

Swagger 已集成 Bearer Token 鉴权。

建议联调顺序：

1. 调用 `POST /api/auth/login`
2. 获取返回的 `accessToken`
3. 在 Swagger 右上角点击 `Authorize`
4. 填入 `Bearer <accessToken>` 或直接填 token
5. 调用后台接口

Swagger 地址：

```text
/api/docs
```

## 主要接口概览

### Auth

- `POST /api/auth/login`
- `GET /api/auth/profile`

### AdminUser

- `GET /api/admin/admin-users`
- `POST /api/admin/admin-users`
- `GET /api/admin/admin-users/:id`
- `PATCH /api/admin/admin-users/:id`
- `PATCH /api/admin/admin-users/:id/password`

### News

- `GET /api/admin/news`
- `POST /api/admin/news`
- `GET /api/admin/news/:id`
- `PATCH /api/admin/news/:id`
- `DELETE /api/admin/news/:id`
- `PATCH /api/admin/news/:id/publish`
- `PATCH /api/admin/news/:id/offline`
- `GET /api/web/news`
- `GET /api/web/news/:slug`

### Case Study

- `GET /api/admin/case-studies`
- `POST /api/admin/case-studies`
- `GET /api/admin/case-studies/:id`
- `PATCH /api/admin/case-studies/:id`
- `DELETE /api/admin/case-studies/:id`
- `PATCH /api/admin/case-studies/:id/publish`
- `PATCH /api/admin/case-studies/:id/offline`
- `GET /api/web/case-studies`
- `GET /api/web/case-studies/:slug`

### Service

- `GET /api/admin/services`
- `POST /api/admin/services`
- `GET /api/admin/services/:id`
- `PATCH /api/admin/services/:id`
- `DELETE /api/admin/services/:id`
- `PATCH /api/admin/services/:id/publish`
- `PATCH /api/admin/services/:id/offline`
- `GET /api/web/services`
- `GET /api/web/services/:slug`

### Site Config

- `GET /api/admin/site-config`
- `PUT /api/admin/site-config`
- `GET /api/web/site-config`

### Lead

- `POST /api/web/leads`
- `GET /api/admin/leads`
- `GET /api/admin/leads/:id`
- `PATCH /api/admin/leads/:id/status`
- `PATCH /api/admin/leads/:id/remark`

### Upload

- `POST /api/admin/upload/image`
- `GET /api/admin/uploads`

### Operation Log

- `GET /api/admin/operation-logs`
- `GET /api/admin/operation-logs/:id`

## 权限说明

当前角色简化为两类：

- `super_admin`
- `editor`

权限约定：

- `super_admin`
  - 管理员管理
  - 站点配置维护
  - 操作日志查询
- `editor`
  - 内容管理
  - 线索管理
  - 文件上传

前台接口默认公开，但只返回允许公开的数据。

## 当前已知限制

- 暂未实现 refresh token
- 暂未接入 Redis 登录态管理
- 暂未实现细粒度 RBAC 权限系统
- 暂未补齐 Swagger 响应模型细节
- 暂未实现 OSS / COS / S3 存储 provider
- 暂未加入单元测试与 e2e 测试

## 后续建议

- 补充 Swagger 响应模型与错误码说明
- 为上传模块增加 OSS 存储实现
- 为登录与关键操作补 IP / User-Agent 真实采集
- 增加接口测试和种子数据脚本
- 补充 PM2 / Nginx / Docker 部署文档

## 参考文档

- 架构设计文档：[docs/api-architecture.md](./docs/api-architecture.md)
