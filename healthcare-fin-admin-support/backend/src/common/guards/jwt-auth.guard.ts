import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

export type RequestUser = {
  sub: string        // users.id
  role: 'patient' | 'caregiver' | 'caseworker' | 'admin'
  locale?: string
}

declare module 'express' {
  interface Request {
    user?: RequestUser
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest()
    const header: string | undefined = req.headers['authorization']
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('missing bearer token')

    try {
      req.user = this.jwt.verify<RequestUser>(header.slice(7), {
        secret: process.env.JWT_ACCESS_SECRET,
      })
      return true
    } catch {
      throw new UnauthorizedException('invalid or expired token')
    }
  }
}
