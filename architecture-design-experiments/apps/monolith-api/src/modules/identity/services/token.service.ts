import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private jwtService: JwtService) {}

  async verifyAccessToken(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }

  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }
}
