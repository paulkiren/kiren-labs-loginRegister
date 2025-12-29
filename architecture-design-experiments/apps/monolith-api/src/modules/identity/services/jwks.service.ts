import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class JwksService {
  private jwks: any;

  constructor(private config: ConfigService) {
    const jwksPath = this.config.get('PUBLIC_JWKS_PATH') || join(process.cwd(), '../../secrets/jwks.json');
    this.jwks = JSON.parse(readFileSync(jwksPath, 'utf8'));
  }

  getJwks() {
    return this.jwks;
  }
}
