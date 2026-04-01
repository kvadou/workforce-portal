/**
 * Create a mock session object for testing auth-related functions.
 */
export function createMockSession(overrides: {
  id?: string;
  role?: string;
  email?: string;
  organizationId?: string | null;
  isOnboarding?: boolean;
} = {}) {
  return {
    user: {
      id: overrides.id ?? "test-user-id",
      role: overrides.role ?? "TUTOR",
      email: overrides.email ?? "test@example.com",
      organizationId: overrides.organizationId ?? null,
      isOnboarding: overrides.isOnboarding ?? false,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}
