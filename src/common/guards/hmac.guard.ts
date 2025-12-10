import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Simple shared-secret guard to prevent spoofing.
 * Expects header: x-shared-secret: <SHARED_SECRET_KEY>
 */
@Injectable()
export class HmacGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const sharedSecret = this.configService.get<string>('SHARED_SECRET_KEY');
    if (!sharedSecret) {
      throw new UnauthorizedException('Shared secret is not configured');
    }

    const incomingSecret =
      (request.headers['x-shared-secret'] as string) ||
      (request.headers['x-shared-secret'.toLowerCase()] as string);

    if (!incomingSecret || incomingSecret !== sharedSecret) {
      throw new UnauthorizedException('Invalid shared secret');
    }

    return true;
  }
}

