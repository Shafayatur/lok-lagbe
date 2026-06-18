'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const statusBadge: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
}

export default function UserOrdersClient({ initialOrders }: { initialOrders: any[] }) {
    const [orders, setOrders] = useState(initialOrders)
    const [marking, setMarking] = useState<string | null>(null)
    const supabase = createClient()

    const handleMarkCompleted = async (order: any) => {
        setMarking(order.id)

        // 1. Mark order as completed
        await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id)

        // 2. NOW create transaction — money split happens here after job is done
        const commissionRate = 0.10
        const commissionAmount = parseFloat((order.total_amount * commissionRate).toFixed(2))
        const vendorPayout = parseFloat((order.total_amount - commissionAmount).toFixed(2))

        await supabase.from('transactions').insert({
            order_id: order.id,
            vendor_id: order.vendor_id,
            total_amount: order.total_amount,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            vendor_payout: vendorPayout,
            payout_status: 'pending', // vendor can now see his pending amount
        })

        // 3. Update local state
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'completed' } : o))
        setMarking(null)
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-[#1A1A2E] text-xl mb-6">My Bookings</h2>
            {orders.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">📭</div>
                    <p>No bookings yet</p>
                    <Link href="/services" className="text-[#E8441A] font-semibold text-sm mt-2 inline-block hover:underline">Browse services →</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order: any) => (
                        <div key={order.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span>{order.service?.category?.icon}</span>
                                    <span className="font-semibold text-[#1A1A2E]">{order.service?.title}</span>
                                </div>
                                <p className="text-xs text-gray-500">📍 {order.address}</p>
                                <p className="text-xs text-gray-500">📅 {new Date(order.scheduled_at).toLocaleString('en-BD')}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {order.payment_status === 'paid' ? '✅ Paid' : '⏳ Payment pending'}
                                </p>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                                <div className="font-bold text-[#1A1A2E] mb-1">৳{order.total_amount}</div>
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadge[order.status]}`}>
                                    {order.status}
                                </span>
                                {order.status === 'confirmed' && (
                                    <div className="mt-2">
                                        <button
                                            onClick={() => handleMarkCompleted(order)}
                                            disabled={marking === order.id}
                                            className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-all font-medium disabled:opacity-60"
                                        >
                                            {marking === order.id ? '...' : '✓ Mark as Done'}
                                        </button>
                                        <p className="text-xs text-gray-400 mt-1">Job completed?</p>
                                    </div>
                                )}
                                {order.status === 'pending' && (
                                    <p className="text-xs text-yellow-600 mt-2">Awaiting vendor</p>
                                )}
                                {order.status === 'cancelled' && (
                                    <p className="text-xs text-red-400 mt-2">Refund in progress</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}