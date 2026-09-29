import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UseGuards } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtAuthGuard, RequestUser } from './jwt-auth.guard'

export type Role = RequestUser['role']

export const ROLES_KEY = 'hfas:roles'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

/** Composite: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles('admin') */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (!required?.length) return true

    const req = ctx.switchToHttp().getRequest()
    const user: RequestUser | undefined = req.user
    if (!user) throw new ForbiddenException('unauthenticated')
    if (!required.includes(user.role)) {
      throw new ForbiddenException(`requires role: ${required.join(' | ')}`)
    }
    return true
  }
}

/** Convenience decorator combining auth + RBAC. */
export const Auth = (...roles: Role[]) => UseGuards(JwtAuthGuard, RolesGuard) && Roles(...roles)
