import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { token, paths } = await req.json().catch(() => ({}))
  if (token !== process.env.REVALIDATE_TOKEN)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  for (const p of Array.isArray(paths) ? paths : []) {
    if (typeof p === 'string' && p.startsWith('/')) revalidatePath(p)
  }
  return NextResponse.json({ ok: true })
}
