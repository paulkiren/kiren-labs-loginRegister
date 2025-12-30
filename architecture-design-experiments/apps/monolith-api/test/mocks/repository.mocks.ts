import { mock, MockProxy } from 'jest-mock-extended';
import { UserRepository } from '../../src/domain/ports/user.repository';
import { RefreshSessionRepository } from '../../src/domain/ports/refresh-session.repository';
import { PasswordResetRepository } from '../../src/domain/ports/password-reset.repository';

export const createMockUserRepository = (): MockProxy<UserRepository> => {
  return mock<UserRepository>();
};

export const createMockRefreshSessionRepository =
  (): MockProxy<RefreshSessionRepository> => {
    return mock<RefreshSessionRepository>();
  };

export const createMockPasswordResetRepository =
  (): MockProxy<PasswordResetRepository> => {
    return mock<PasswordResetRepository>();
  };
