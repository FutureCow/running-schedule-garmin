import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check of gebruiker al een profiel heeft
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/onboarding')
  redirect('/dashboard')
}
