import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import {
  getRoleLevel,
  hasMinRole,
  canManageRole,
} from "@/lib/roles";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials");
          return null;
        }

        // Demo mode: accept demo credentials without DB lookup
        if (credentials.email === "demo@acmeworkforce.com" && credentials.password === "demo") {
          console.log("[Auth] Demo login");
          return {
            id: "demo-user",
            email: "demo@acmeworkforce.com",
            name: "Demo User",
            role: "ADMIN",
            organizationId: null,
            organizationSubdomain: null,
            isOnboarding: false,
          };
        }

        try {
          console.log("[Auth] Looking up user:", credentials.email);
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              organization: {
                select: {
                  id: true,
                  subdomain: true,
                },
              },
            },
          });

          if (!user) {
            console.log("[Auth] User not found:", credentials.email);
            return null;
          }

          if (!user.passwordHash) {
            console.log("[Auth] User has no password hash:", credentials.email);
            return null;
          }

          console.log("[Auth] Comparing passwords for:", credentials.email);
          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            console.log("[Auth] Invalid password for:", credentials.email);
            return null;
          }

          console.log("[Auth] Login successful for:", credentials.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationSubdomain: user.organization?.subdomain || null,
            isOnboarding: user.isOnboarding,
          };
        } catch (error) {
          console.error("[Auth] Database error:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          hd: "acmeworkforce.com",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only apply custom logic for Google sign-in
      if (account?.provider !== "google") return true;

      const email = user.email;
      if (!email?.endsWith("@acmeworkforce.com")) {
        console.log("[Auth] Google sign-in rejected: non-Acme email", email);
        return false;
      }

      try {
        // Look up existing user
        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: { organization: { select: { id: true, subdomain: true } } },
        });

        if (existingUser) {
          // If existing user has a role below ADMIN, promote them
          const adminRoles = ["ADMIN", "SUPER_ADMIN"];
          if (!adminRoles.includes(existingUser.role)) {
            await prisma.user.update({
              where: { email },
              data: { role: "ADMIN" },
            });
            console.log("[Auth] Promoted user to ADMIN via Google:", email);
          }
        } else {
          // Create new ADMIN user from Google profile
          // Find HQ organization
          const hqOrg = await prisma.organization.findFirst({
            where: { isHQ: true },
          });

          await prisma.user.create({
            data: {
              email,
              name: user.name || null,
              avatarUrl: (profile as { picture?: string })?.picture || null,
              role: "ADMIN",
              organizationId: hqOrg?.id || null,
              isOnboarding: false,
            },
          });
          console.log("[Auth] Created new ADMIN user via Google:", email);
        }

        return true;
      } catch (error) {
        console.error("[Auth] Google sign-in error:", error);
        return false;
      }
    },
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        if (account?.provider === "google") {
          // For Google sign-in, look up the DB user to get proper fields
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { organization: { select: { id: true, subdomain: true } } },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.organizationId = dbUser.organizationId;
            token.organizationSubdomain = dbUser.organization?.subdomain || null;
            token.isOnboarding = false;
          }
        } else {
          token.id = user.id;
          token.role = user.role;
          token.organizationId = user.organizationId;
          token.organizationSubdomain = user.organizationSubdomain;
          token.isOnboarding = user.isOnboarding;
        }
      }

      // Handle session updates (e.g., after completing onboarding)
      // SECURITY: Never accept role from client — role must only come from database
      if (trigger === "update" && session) {
        if (session.isOnboarding !== undefined) token.isOnboarding = session.isOnboarding;
        if (session.organizationId) token.organizationId = session.organizationId;
        if (session.organizationSubdomain) token.organizationSubdomain = session.organizationSubdomain;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.organizationSubdomain = token.organizationSubdomain;
        session.user.isOnboarding = token.isOnboarding;
      }
      return session;
    },
  },
};

// Helper to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper to verify passwords
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export { getRoleLevel, hasMinRole, canManageRole };
