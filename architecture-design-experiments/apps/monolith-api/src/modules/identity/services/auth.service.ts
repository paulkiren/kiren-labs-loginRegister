import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../../domain/ports/user.repository';
import { RefreshSessionRepository } from '../../../domain/ports/refresh-session.repository';
import { PasswordResetRepository } from '../../../domain/ports/password-reset.repository';
import { CryptoService } from '../../../domain/ports/crypto.service';
import { TokenService } from './token.service';
import { RegisterDto, LoginDto, RefreshDto, LogoutDto, PasswordResetRequestDto, PasswordResetConfirmDto } from '../dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('UserRepository') private userRepo: UserRepository,
    @Inject('RefreshSessionRepository') private sessionRepo: RefreshSessionRepository,
    @Inject('PasswordResetRepository') private resetRepo: PasswordResetRepository,
    @Inject('CryptoService') private crypto: CryptoService,
    private tokenService: TokenService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.crypto.hashPassword(dto.password);
    const user = await this.userRepo.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
    });

    const { accessToken, refreshToken, tokenId, expiresAt } = await this.issueTokens(user.id);

    return {
      accessToken,
      refreshToken,
      tokenId,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findByEmail(dto.email);
    if (!user || !(await this.crypto.verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken, tokenId, expiresAt } = await this.issueTokens(user.id);

    return {
      accessToken,
      refreshToken,
      tokenId,
      expiresIn: 900,
      tokenType: 'Bearer',
    };
  }

  async refresh(dto: RefreshDto) {
    const session = await this.sessionRepo.findById(dto.tokenId);
    
    if (!session || session.revokedAt || session.reuseDetectedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > session.expiresAt) {
      await this.sessionRepo.deleteById(dto.tokenId);
      throw new UnauthorizedException('Refresh token expired');
    }

    const tokenHash = this.crypto.hashToken(dto.token);
    if (tokenHash !== session.tokenHash) {
      await this.sessionRepo.update(dto.tokenId, { reuseDetectedAt: new Date() });
      await this.sessionRepo.revokeAllForUser(session.userId);
      throw new UnauthorizedException('Token reuse detected');
    }

    await this.sessionRepo.deleteById(dto.tokenId);

    const { accessToken, refreshToken, tokenId, expiresAt } = await this.issueTokens(session.userId);

    return {
      accessToken,
      refreshToken,
      tokenId,
      expiresIn: 900,
    };
  }

  async logout(dto: LogoutDto) {
    await this.sessionRepo.deleteById(dto.tokenId);
    return { message: 'Logged out successfully' };
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const user = await this.userRepo.findByEmail(dto.email);
    
    if (user) {
      const resetToken = this.crypto.generateToken(32);
      const tokenHash = this.crypto.hashToken(resetToken);
      const ttlMinutes = parseInt(this.config.get('RESET_TOKEN_TTL_MINUTES') || '30');
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await this.resetRepo.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      console.log(`Password reset token for ${dto.email}: ${resetToken}`);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto) {
    const tokenHash = this.crypto.hashToken(dto.token);
    const reset = await this.resetRepo.findByTokenHash(tokenHash);

    if (!reset || reset.usedAt || new Date() > reset.expiresAt) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const passwordHash = await this.crypto.hashPassword(dto.password);
    await this.userRepo.update(reset.userId, { passwordHash });
    await this.resetRepo.markAsUsed(reset.id);

    return { message: 'Password reset successful' };
  }

  private async issueTokens(userId: string) {
    const accessToken = this.tokenService.signAccessToken(userId);
    const refreshToken = this.crypto.generateToken();
    const tokenHash = this.crypto.hashToken(refreshToken);
    const ttlSeconds = parseInt(this.config.get('REFRESH_TTL_SECONDS') || '604800');
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const session = await this.sessionRepo.create({
      userId,
      tokenHash,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      tokenId: session.id,
      expiresAt,
    };
  }
}
