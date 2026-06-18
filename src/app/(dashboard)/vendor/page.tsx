'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/shared/Navbar'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Service, Order, Category } from '@/types'

export default function VendorDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [tab, setTab] = useState<'orders' | 'services' | 'add'>('orders')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', price: '', price_unit: 'per job', category_id: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p?.role !== 'vendor') { router.push('/user'); return }
      setProfile(p)
      const [{ data: s }, { data: o }, { data: c }, { data: t }] = await Promise.all([
        supabase.from('services').select('*, category:categories(name, icon)').eq('vendor_id', user.id),
        supabase.from('orders').select('*, service:services(title, price)').eq('vendor_id', user.id).order('created_at', { ascending: false }),
        supabase.from('categories').select('*'),
        supabase.from('transactions').select('*').eq('vendor_id', user.id)
      ])
      setServices(s || [])
      setOrders(o || [])
      setCategories(c || [])
      setTransactions(t || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)
    if (error) { console.error('Update error:', error); return }
    setOrders(prev => prev.map((o: any) => o.id === orderId ? { ...o, status } : o))
  }

  const handleAddService = async () => {
    if (!form.title || !form.description || !form.price || !form.category_id) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('services').insert({ ...form, price: parseFloat(form.price), vendor_id: user!.id })
    setSuccess('Service added!')
    setForm({ title: '', description: '', price: '', price_unit: 'per job', category_id: '' })
    const { data: s } = await supabase.from('services').select('*, category:categories(name, icon)').eq('vendor_id', user!.id)
    setServices(s || [])
    setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  const statusBadge: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const pendingPayout = transactions.filter(t => t.payout_status === 'pending').reduce((sum, t) => sum + Number(t.vendor_payout), 0)
  const releasedPayout = transactions.filter(t => t.payout_status === 'released').reduce((sum, t) => sum + Number(t.vendor_payout), 0)

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin text-4xl">⚙️</div></div>

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      <Navbar user={profile} />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#1A1A2E]">Vendor Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome, {profile?.full_name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <div className="text-2xl mb-1">🛠️</div>
            <div className="text-2xl font-black text-[#1A1A2E]">{services.length}</div>
            <div className="text-xs text-gray-500 mt-1">My Services</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <div className="text-2xl mb-1">📋</div>
            <div className="text-2xl font-black text-[#1A1A2E]">{orders.length}</div>
            <div className="text-xs text-gray-500 mt-1">Total Jobs</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center">
            <div className="text-2xl mb-1">⏳</div>
            <div className="text-2xl font-black text-yellow-700">৳{pendingPayout.toFixed(0)}</div>
            <div className="text-xs text-yellow-600 mt-1">Pending Payout</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-2xl font-black text-green-700">৳{releasedPayout.toFixed(0)}</div>
            <div className="text-xs text-green-600 mt-1">Released to You</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[['orders', '📋 Orders'], ['services', '🛠️ My Services'], ['add', '+ Add Service']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t as any)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === t ? 'bg-[#E8441A] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#E8441A]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-[#1A1A2E] text-xl mb-6">Incoming Jobs</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-3">📭</div><p>No orders yet</p></div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <div key={order.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-[#1A1A2E]">{order.service?.title}</p>
                        <p className="text-sm text-gray-500 mt-1">📍 {order.address}</p>
                        <p className="text-sm text-gray-500">📅 {new Date(order.scheduled_at).toLocaleString('en-BD')}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {order.payment_status === 'paid' ? '✅ Customer paid' : '⏳ Payment pending'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-[#E8441A] text-lg">৳{order.total_amount}</p>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[order.status]}`}>
                          {order.status}
                        </span>
                        {order.status === 'pending' && (
                          <div className="flex gap-2 mt-2 justify-end">
                            <button onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                              className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-all font-medium">
                              ✓ Confirm
                            </button>
                            <button onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-all font-medium">
                              ✕ Cancel
                            </button>
                          </div>
                        )}
                        {order.status === 'confirmed' && <p className="text-xs text-blue-500 mt-2 font-medium">⏳ Job in progress</p>}
                        {order.status === 'completed' && <p className="text-xs text-green-500 mt-2 font-medium">✅ Completed</p>}
                        {order.status === 'cancelled' && <p className="text-xs text-red-400 mt-2">Cancelled</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Services Tab */}
        {tab === 'services' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-[#1A1A2E] text-xl mb-6">My Services</h2>
            {services.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">🛠️</div><p>No services yet</p>
                <button onClick={() => setTab('add')} className="text-[#E8441A] font-semibold text-sm mt-2 hover:underline">Add your first service →</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((s: any) => (
                  <div key={s.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between">
                      <div>
                        <span className="text-xs bg-[#E8441A]/10 text-[#E8441A] px-2 py-0.5 rounded-full">{s.category?.icon} {s.category?.name}</span>
                        <p className="font-bold text-[#1A1A2E] mt-2">{s.title}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description}</p>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="font-black text-[#E8441A]">৳{s.price}</p>
                        <p className="text-xs text-gray-400">{s.price_unit}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Service Tab */}
        {tab === 'add' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-[#1A1A2E] text-xl mb-6">Add New Service</h2>
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">✅ {success}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E8441A] text-sm">
                  <option value="">Select category...</option>
                  {categories.map((c: Category) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Kitchen Pipe Leak Repair" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E8441A] text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  placeholder="Describe what you offer..." className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E8441A] resize-none text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (৳) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    placeholder="500" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E8441A] text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Unit</label>
                  <select value={form.price_unit} onChange={e => setForm({ ...form, price_unit: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E8441A] text-sm">
                    <option>per job</option>
                    <option>per hour</option>
                    <option>per visit</option>
                  </select>
                </div>
              </div>
              <button onClick={handleAddService} disabled={saving}
                className="w-full bg-[#E8441A] hover:bg-[#C73610] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60">
                {saving ? 'Adding...' : 'Add Service'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}