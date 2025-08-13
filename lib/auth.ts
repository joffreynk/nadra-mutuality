import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import NextAuth from 'next-auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const credentialsSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      organizationId: string;
    };
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    organizationId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    organizationId: string;
  }
}

export const authOptions = {
  // For local/dev fallback to a static secret if env is missing to avoid runtime errors
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-secret-change-me',
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' as const },
  pages: {
    signIn: '/login'
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { username, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || user.isLocked || !user.organizationId) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          // increment failed logins and lock after threshold
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: { failedLogins: { increment: 1 }, isLocked: user.failedLogins + 1 >= 5 }
          });
          await prisma.auditLog.create({
            data: {
              organizationId: user.organizationId,
              userId: user.id,
              action: 'login_failed',
              entityType: 'User',
              entityId: user.id
            }
          });
          if (updated.isLocked) {
            // optionally notify admin of lockout
          }
          return null;
        }

        if (user.failedLogins > 0 || user.isLocked) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLogins: 0, isLocked: false }
          });
        }

        await prisma.auditLog.create({
          data: {
            organizationId: user.organizationId,
            userId: user.id,
            action: 'login_success',
            entityType: 'User',
            entityId: user.id
          }
        });

        return {
          id: user.id,
          name: user.name ?? user.username,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.id = token.sub!;
      }
      return session;
    }
  }
};

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth(authOptions);


