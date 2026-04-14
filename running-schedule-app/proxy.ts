import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth(function proxy(request) {
  const { pathname } = request.nextUrl
  const session = request.auth

  const publicRoutes = ['/login', '/register']

  if (!session && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
