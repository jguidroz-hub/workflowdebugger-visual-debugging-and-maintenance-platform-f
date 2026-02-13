import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Return user settings (extend with domain-specific settings table)
    return NextResponse.json({
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
    });
  } catch (error: any) {
    console.error('[settings] Error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.length > 100) {
        return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
      }
      const { users } = await import('@/lib/schema');
      await db.update(users).set({ name: name.trim(), updatedAt: new Date() }).where(eq(users.id, session.user.id));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[settings] Error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
