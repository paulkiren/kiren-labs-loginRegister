import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class JwksService implements OnModuleInit {
  private jwks: any;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const jwksPath = this.config.get('PUBLIC_JWKS_PATH') || resolve(__dirname, '../../../../secrets/jwks.json');
    
    try {
      if (existsSync(jwksPath)) {
        this.jwks = JSON.parse(readFileSync(jwksPath, 'utf8'));
      } else {
        console.warn(`JWKS not found at ${jwksPath}, using placeholder`);
        this.jwks = { keys: [] };
      }
    } catch (error) {
      console.warn('Failed to read JWKS:', error.message);
      this.jwks = { keys: [] };
    }
  }

  getJwks() {
    return this.jwks;
  }
}
