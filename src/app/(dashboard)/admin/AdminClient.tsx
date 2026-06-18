'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const orderStatusBadge: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
}

export default function AdminClient({ allUsers, allOrders, allServices, initialTransactions }: {
    allUsers: Profile[]
    allOrders: any[]
    allServices: any[]
    initialTransactions: any[]
}) {
    const [transactions, setTransactions] = useState(initialTransactions)
    const [orders, setOrders] = useState(allOrders)
    const [tab, setTab] = useState<'overview' | 'orders' | 'payouts' | 'users'>('overview')
    const [processing, setProcessing] = useState<string | null>(null)
    const supabase = createClient()

    // Money stats
    const totalCollected = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total_amount), 0)
    const totalRefunded = orders.filter(o => o.status === 'cancelled' && o.payment_status === 'paid').reduce((sum, o) => sum + Number(o.total_amount), 0)
    const platformEarnings = transactions.filter(t => t.payout_status === 'released').reduce((sum, t) => sum + Number(t.commission_amount), 0)
    const pendingReleaseAmount = transactions.filter(t => t.payout_status === 'pending').reduce((sum, t) => sum + Number(t.vendor_payout), 0)

    // Cancelled orders needing refund
    const cancelledNeedingRefund = orders.filter(o => o.status === 'cancelled' && o.payment_status === 'paid' && !o.refunded)
    // Orders completed but not yet released
    const pendingRelease = transactions.filter(t => t.payout_status === 'pending')

    const handleReleasePayout = async (transactionId: string) => {
        setProcessing(transactionId)
        await supabase.from('transactions').update({ payout_status: 'released' }).eq('id', transactionId)
        setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, payout_status: 'released' } : t))
        setProcessing(null)
    }

    const handleRefund = async (orderId: string) => {
        setProcessing(orderId)
        // Mark order as refunded (in real: trigger Stripe refund)
        await supabase.from('orders').update({ payment_status: 'refunded' } as any).eq('id', orderId)
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: 'refunded' } : o))
        setProcessing(null)
    }

    const vendors = allUsers.filter(u => u.role === 'vendor')

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-[#1A1A2E]">Admin Panel</h1>
                <p className="text-gray-500 mt-1">Platform overview and financial management</p>
            </div>

            {/* Alerts */}
            {cancelledNeedingRefund.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-red-800">❌ {cancelledNeedingRefund.length} cancelled order(s) need refund</p>
                        <p className="text-sm text-red-600 mt-0.5">Go to Orders tab to process refunds</p>
                    </div>
                    <button onClick={() => setTab('orders')} className="text-sm text-red-600 font-semibold underline">View →</button>
                </div>
            )}
            {pendingRelease.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-yellow-800">⏳ {pendingRelease.length} vendor payout(s) ready to release</p>
                        <p className="text-sm text-yellow-600 mt-0.5">৳{pendingReleaseAmount.toFixed(0)} waiting — job completed by customer</p>
                    </div>
                    <button onClick={() => setTab('payouts')} className="text-sm text-yellow-700 font-semibold underline">Release →</button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Collected', value: `৳${totalCollected.toFixed(0)}`, icon: '💰', color: 'bg-blue-50 text-blue-700', desc: 'In platform vault' },
                    { label: 'Pending Release', value: `৳${pendingReleaseAmount.toFixed(0)}`, icon: '⏳', color: 'bg-yellow-50 text-yellow-700', desc: 'Owed to vendors' },
                    { label: 'Platform Earned', value: `৳${platformEarnings.toFixed(0)}`, icon: '📈', color: 'bg-green-50 text-green-700', desc: '10% commission' },
                    { label: 'Total Orders', value: orders.length, icon: '📋', color: 'bg-purple-50 text-purple-700', desc: 'All time' },
                ].map(({ label, value, icon, color, desc }) => (
                    <div key={label} className={`rounded-2xl p-5 ${color}`}>
                        <div className="text-2xl mb-2">{icon}</div>
                        <div className="text-2xl font-black">{value}</div>
                        <div className="text-xs font-medium mt-1 opacity-70">{label}</div>
                        <div className="text-xs opacity-50 mt-0.5">{desc}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {[['overview', '📊 Overview'], ['payouts', '💸 Payouts'], ['orders', '📋 Orders'], ['users', '👥 Users']].map(([t, label]) => (
                    <button key={t} onClick={() => setTab(t as any)}
                        className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${tab === t ? 'bg-[#E8441A] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#E8441A]'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Overview */}
            {tab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="font-black text-[#1A1A2E] text-lg mb-4">Recent Orders</h2>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {orders.slice(0, 10).map((o: any) => (
                                <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                                    <div>
                                        <p className="font-semibold text-[#1A1A2E]">{o.service?.title}</p>
                                        <p className="text-xs text-gray-400">{o.payment_status === 'paid' ? '✅ Paid' : o.payment_status === 'refunded' ? '↩ Refunded' : '⏳ Unpaid'}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <p className="font-bold text-[#E8441A]">৳{o.total_amount}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${orderStatusBadge[o.status]}`}>{o.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h2 className="font-black text-[#1A1A2E] text-lg mb-4">All Services ({allServices.length})</h2>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {allServices.map((s: any) => (
                                <div key={s.id} className="p-3 bg-gray-50 rounded-xl text-sm">
                                    <p className="font-semibold text-[#1A1A2E]">{s.title}</p>
                                    <p className="text-xs text-gray-500">{s.category?.icon} {s.category?.name} • by {s.vendor?.full_name}</p>
                                    <p className="text-xs font-bold text-[#E8441A] mt-1">৳{s.price}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Payouts */}
            {tab === 'payouts' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="font-black text-[#1A1A2E] text-xl mb-2">Vendor Payouts</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Release button appears only after customer marks job as done.
                        Platform keeps 10%, vendor gets 90%.
                    </p>
                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <div className="text-4xl mb-3">💸</div>
                            <p>No transactions yet</p>
                            <p className="text-xs mt-1">Transactions appear after customer marks job as done</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((t: any) => (
                                <div key={t.id} className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-[#1A1A2E]">Order #{t.order_id.slice(0, 8).toUpperCase()}</p>
                                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${t.payout_status === 'released' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {t.payout_status === 'released' ? '✅ Released' : '⏳ Pending Release'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">🔧 Vendor: {t.vendor?.full_name}</p>
                                            <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString('en-BD')}</p>
                                        </div>
                                        <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                                            <div className="text-right text-sm">
                                                <p className="text-xs text-gray-400">Total paid</p>
                                                <p className="font-bold text-[#1A1A2E]">৳{t.total_amount}</p>
                                                <p className="text-xs text-green-600">Platform: ৳{t.commission_amount}</p>
                                                <p className="text-xs text-orange-600">Vendor: ৳{t.vendor_payout}</p>
                                            </div>
                                            {t.payout_status === 'pending' ? (
                                                <button onClick={() => handleReleasePayout(t.id)} disabled={processing === t.id}
                                                    className="bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-60">
                                                    {processing === t.id ? '...' : '💸 Release'}
                                                </button>
                                            ) : (
                                                <div className="text-green-500 font-bold text-sm px-4 text-center">✓ Done</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Orders */}
            {tab === 'orders' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="font-black text-[#1A1A2E] text-xl mb-6">All Orders ({orders.length})</h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {orders.map((o: any) => (
                            <div key={o.id} className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-[#1A1A2E]">{o.service?.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">📍 {o.address}</p>
                                        <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString('en-BD')}</p>
                                        <p className="text-xs mt-1">
                                            {o.payment_status === 'paid' ? <span className="text-green-600">✅ Paid ৳{o.total_amount}</span>
                                                : o.payment_status === 'refunded' ? <span className="text-gray-500">↩ Refunded</span>
                                                    : <span className="text-yellow-600">⏳ Unpaid</span>}
                                        </p>
                                    </div>
                                    <div className="text-right ml-4 flex-shrink-0 flex flex-col items-end gap-2">
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${orderStatusBadge[o.status]}`}>{o.status}</span>
                                        {/* Refund button — only for cancelled + paid + not yet refunded */}
                                        {o.status === 'cancelled' && o.payment_status === 'paid' && (
                                            <button onClick={() => handleRefund(o.id)} disabled={processing === o.id}
                                                className="text-xs bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-60">
                                                {processing === o.id ? '...' : '↩ Refund Customer'}
                                            </button>
                                        )}
                                        {o.status === 'cancelled' && o.payment_status === 'refunded' && (
                                            <span className="text-xs text-gray-400">↩ Refunded</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Users */}
            {tab === 'users' && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="font-black text-[#1A1A2E] text-xl mb-6">All Users ({allUsers.length})</h2>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {allUsers.map((u: Profile) => (
                            <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-[#1A1A2E]">{u.full_name}</p>
                                    <p className="text-gray-500 text-xs">{u.email}</p>
                                    {u.phone && <p className="text-gray-400 text-xs">📞 {u.phone}</p>}
                                </div>
                                <span className={`text-xs font-medium px-3 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                        u.role === 'vendor' ? 'bg-blue-100 text-blue-700' :
                                            'bg-green-100 text-green-700'
                                    }`}>{u.role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}