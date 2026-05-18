import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UsersService, type PublicUser } from '../users/users.service';

type TokenPayload = {
  sub: number;
  email: string;
  role: string;
  exp: number;
};

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me';
  private readonly expiresInSeconds = Number(process.env.JWT_EXPIRES_IN_SECONDS || 60 * 60 * 24);

  constructor(private readonly usersService: UsersService) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({ ...registerDto, role: 'manager' });
    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user || !this.usersService.verifyPassword(loginDto.password, user.passwordHash)) {
      throw new UnauthorizedException('Неправильний email або пароль');
    }

    return this.buildAuthResponse(this.usersService.toPublicUser(user));
  }

  async getUserFromToken(token: string): Promise<PublicUser> {
    const payload = this.verifyToken(token);
    const user = await this.usersService.findEntityById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Користувача для цього токена не знайдено');
    }

    return this.usersService.toPublicUser(user);
  }

  private buildAuthResponse(user: PublicUser) {
    return {
      accessToken: this.signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + this.expiresInSeconds,
      }),
      user,
    };
  }

  private signToken(payload: TokenPayload): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private verifyToken(token: string): TokenPayload {
    const [encodedHeader, encodedPayload, signature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('Некоректний токен');
    }

    const expectedSignature = this.createSignature(`${encodedHeader}.${encodedPayload}`);
    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Недійсний токен');
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as TokenPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Термін дії токена завершився');
    }

    return payload;
  }

  private createSignature(value: string): string {
    return createHmac('sha256', this.jwtSecret).update(value).digest('base64url');
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value).toString('base64url');
  }
}
