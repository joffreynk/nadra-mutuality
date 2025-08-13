import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { RoleType } from '@prisma/client';

const signupSchema = z.object({
  organizationName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6)
});

export async function POST(req: Request) {
  try {
    // Check if any users exist
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json(
        { error: 'Signup is only allowed for the first user' },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parsed = signupSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      );
    }

    const { organizationName, name, email, username, password } = parsed.data;

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName
        }
      });

      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          name,
          email,
          username,
          passwordHash,
          role: RoleType.HEALTH_OWNER
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: 'user_create',
          entityType: 'User',
          entityId: user.id,
          after: { ...user, passwordHash: '[HIDDEN]' }
        }
      });

      return { organization, user };
    });

    return NextResponse.json({
      message: 'Health owner account created successfully',
      organizationId: result.organization.id,
      userId: result.user.id
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
