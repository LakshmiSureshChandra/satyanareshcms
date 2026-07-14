import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_ADMIN = ['/admin/login', '/admin/forgot-password', '/admin/reset-password']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_ADMIN.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const token = req.cookies.get('token')?.value
  const login = new URL('/admin/login', req.url)
  if (!token) return NextResponse.redirect(login)
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(login)
  }
}

export const config = { matcher: '/admin/:path*' }
