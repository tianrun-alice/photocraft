import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

interface InMemoryUser {
  id: string
  email: string
  passwordHash: string
  plan: 'free' | 'paid'
  quotaRemaining: number
}

const users: Map<string, InMemoryUser> = new Map()

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(email: string, password: string) {
    if (users.has(email)) throw new ConflictException('邮箱已被注册')
    const passwordHash = await bcrypt.hash(password, 10)
    const user: InMemoryUser = {
      id: randomUUID(),
      email,
      passwordHash,
      plan: 'free',
      quotaRemaining: 10,
    }
    users.set(email, user)
    const access_token = this.jwtService.sign({ sub: user.id, email })
    return { access_token, user: { id: user.id, email: user.email } }
  }

  async login(email: string, password: string) {
    const user = users.get(email)
    if (!user) throw new UnauthorizedException('邮箱或密码错误')
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) throw new UnauthorizedException('邮箱或密码错误')
    const access_token = this.jwtService.sign({ sub: user.id, email })
    return { access_token, user: { id: user.id, email: user.email } }
  }
}

