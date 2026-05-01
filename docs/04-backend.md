# PhotoCraft — 后端实现（packages/server）

## 概述

后端基于 **NestJS 11**，当前仅实现了 **Auth 模块**（注册/登录），使用内存存储用户数据（无数据库）。服务器监听 `PORT` 环境变量指定的端口，默认 `3000`。

## 目录结构

```
packages/server/
├── package.json
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── src/
    ├── main.ts              # 启动入口
    ├── app.module.ts        # 根模块
    └── auth/
        ├── auth.module.ts   # Auth 模块注册
        ├── auth.controller.ts  # HTTP 路由
        ├── auth.service.ts  # 业务逻辑
        └── jwt.strategy.ts  # Passport JWT 策略
```

---

## 启动入口（src/main.ts）

```ts
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
  await app.listen(process.env.PORT || 3000)
  console.log(`Server running on http://localhost:${process.env.PORT || 3000}`)
}
bootstrap()
```

**注意**：`enableCors()` 无参数调用，允许所有来源（开发用，生产环境应配置 `origin`）。

---

## 根模块（src/app.module.ts）

```ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // 读取 .env，全局可用
    AuthModule
  ]
})
export class AppModule {}
```

---

## Auth 模块

### auth.module.ts

```ts
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-production',
        signOptions: { expiresIn: '7d' }
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy]
})
export class AuthModule {}
```

JWT 密钥从 `JWT_SECRET` 环境变量读取，缺省使用开发默认值，**生产环境必须设置此变量**。Token 有效期 7 天。

---

### auth.controller.ts

```ts
@Controller('api/auth')
export class AuthController {
  @Post('register')
  async register(@Body() body: { email: string; password: string }) {
    return this.authService.register(body.email, body.password)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)   // 200（NestJS POST 默认 201）
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password)
  }
}
```

| 路由 | 方法 | 状态码 | 描述 |
|------|------|--------|------|
| `POST /api/auth/register` | register | 201 | 注册新用户 |
| `POST /api/auth/login` | login | 200 | 用户登录 |

---

### auth.service.ts

**用户存储**：模块级 `Map<email, InMemoryUser>`，进程内有效（重启丢失）。

```ts
interface InMemoryUser {
  id: string            // crypto.randomUUID()
  email: string
  passwordHash: string  // bcrypt.hash(password, 10)
  plan: 'free' | 'paid'
  quotaRemaining: number
}

const users: Map<string, InMemoryUser> = new Map()
```

**register(email, password)**：
1. 检查 email 是否已存在，已存在抛 `ConflictException`（409）
2. `bcrypt.hash(password, 10)` 哈希密码
3. 创建用户（plan: 'free', quotaRemaining: 10）
4. `jwtService.sign({ sub: user.id, email })` 生成 Token
5. 返回 `{ access_token, user: { id, email } }`

**login(email, password)**：
1. 查找 email，不存在抛 `UnauthorizedException`（401）
2. `bcrypt.compare(password, passwordHash)` 验证密码
3. 密码错误抛 `UnauthorizedException`
4. 生成 Token，返回同上

---

### jwt.strategy.ts

```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-secret-change-in-production'
    })
  }

  async validate(payload: { sub: string; email: string }) {
    return { userId: payload.sub, email: payload.email }
  }
}
```

其他路由使用 `@UseGuards(AuthGuard('jwt'))` 时，`req.user` 会被设置为 `{ userId, email }`。

---

## 配置文件

### nest-cli.json

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "monorepo": false,
  "sourceRoot": "src",
  "entryFile": "main",
  "language": "ts",
  "generateOptions": { "spec": false },
  "compilerOptions": {
    "manualRestart": true,
    "tsConfigPath": "./tsconfig.build.json",
    "webpack": false,
    "deleteOutDir": true
  }
}
```

`"spec": false` 禁用自动生成测试文件。

### tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2024",
    "strictNullChecks": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": "./",
    "skipLibCheck": true,
    "incremental": true
  }
}
```

`emitDecoratorMetadata` + `experimentalDecorators` 是 NestJS 装饰器（`@Injectable`, `@Controller` 等）正常工作的必需项。

### tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

---

## 环境变量

创建 `packages/server/.env` 文件（不提交到 git）：

```env
PORT=3000
JWT_SECRET=your-strong-secret-here
```

---

## API 响应格式

### 注册/登录成功

```json
{
  "access_token": "eyJhbGci...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com"
  }
}
```

### 错误响应（NestJS 默认格式）

```json
{
  "statusCode": 409,
  "message": "邮箱已被注册",
  "error": "Conflict"
}
```