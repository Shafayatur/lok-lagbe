export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import AdminClient from './AdminClient'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const [{ data: allUsers }, { data: allOrders }, { data: allServices }, { data: allTransactions }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('orders').select('*, service:services(title, price)').order('created_at', { ascending: false }).limit(50),
    supabase.from('services').select('*, vendor:profiles(full_name), category:categories(name, icon)').order('created_at', { ascending: false }),
    supabase.from('transactions').select('*, vendor:profiles(full_name), order:orders(status)').order('created_at', { ascending: false }),
  ])

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      <Navbar user={profile} />
      <AdminClient
        allUsers={allUsers || []}
        allOrders={allOrders || []}
        allServices={allServices || []}
        initialTransactions={allTransactions || []}
      />
    </div>
  )
}