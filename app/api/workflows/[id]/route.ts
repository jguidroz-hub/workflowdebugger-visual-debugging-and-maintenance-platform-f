import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { workflows } from '@/lib/domain-schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const [item] = await db.select().from(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.userId, session.user.id)))
    .limit(1);

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const [updated] = await db.update(workflows)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(workflows.id, id), eq(workflows.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await db.delete(workflows)
    .where(and(eq(workflows.id, id), eq(workflows.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
