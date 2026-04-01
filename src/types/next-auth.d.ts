import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: UserRole;
    organizationId?: string | null;
    organizationSubdomain?: string | null;
    isOnboarding?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      organizationId?: string | null;
      organizationSubdomain?: string | null;
      isOnboarding?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    organizationId?: string | null;
    organizationSubdomain?: string | null;
    isOnboarding?: boolean;
  }
}
