export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import UserOrdersClient from './OrdersClient'

export default async function UserDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role === 'vendor') redirect('/vendor')

  const { data: orders } = await supabase
    .from('orders')
    .select('*, service:services(title, price, price_unit, category:categories(name, icon))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      <Navbar user={profile} />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#1A1A2E]">My Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {profile?.full_name}</p>
          </div>
          <Link href="/services" className="bg-[#E8441A] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#C73610] transition-all text-sm">
            + Book Service
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: orders?.length || 0, icon: '📋' },
            { label: 'Confirmed', value: orders?.filter((o: any) => o.status === 'confirmed').length || 0, icon: '✅' },
            { label: 'Completed', value: orders?.filter((o: any) => o.status === 'completed').length || 0, icon: '🎉' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-2xl font-black text-[#1A1A2E]">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>

        <UserOrdersClient initialOrders={orders || []} />
      </div>
    </div>
  )
}
