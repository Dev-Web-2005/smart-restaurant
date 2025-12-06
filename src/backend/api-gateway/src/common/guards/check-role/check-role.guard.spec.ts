import { CheckRoleGuard } from './check-role.guard';

describe('CheckRoleGuard', () => {
  it('should be defined', () => {
    expect(new CheckRoleGuard()).toBeDefined();
  });
});
