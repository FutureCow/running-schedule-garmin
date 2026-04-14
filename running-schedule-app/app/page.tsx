import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export default async function Home() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const profiles = await sql`
    SELECT user_id FROM profiles WHERE user_id = ${session.user.id}
  `

  if (profiles.length === 0) redirect('/onboarding')
  redirect('/dashboard')
}
