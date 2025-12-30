
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { verifyPassword } from '../common/hash.util';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(dto);
    return { id: user.id, email: user.email, username: user.username };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await verifyPassword(dto.password, user.hashedPassword);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const token = await this.jwtService.signAsync(
      { sub: user.id },
      { secret: process.env.JWT_SECRET || 'dev-secret', expiresIn: process.env.TOKEN_EXPIRY || '60m' } as any
    );

    return { access_token: token, token_type: 'bearer' };
  }
}
