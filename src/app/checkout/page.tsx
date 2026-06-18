'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/shared/Navbar'
import type { Profile } from '@/types'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const CARD_STYLE = {
  style: {
    base: { fontSize: '15px', color: '#1A1A2E', fontFamily: 'Inter, sans-serif', '::placeholder': { color: '#9ca3af' } },
    invalid: { color: '#ef4444' },
  },
}

function BookingStep({ service, address, setAddress, scheduledAt, setScheduledAt, onNext, loading }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold text-[#1A1A2E] text-lg mb-4">Service Summary</h2>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-[#1A1A2E]">{service.title}</p>
            <p className="text-sm text-gray-500">{service.category?.icon} {service.category?.name}</p>
            <p className="text-sm text-gray-500 mt-1">by {service.vendor?.full_name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#E8441A]">৳{service.price}</p>
            <p className="text-xs text-gray-400">{service.price_unit}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-[#1A1A2E] text-lg">Booking Details</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Address *</label>
          <textarea value={address} onChange={(e: any) => setAddress(e.target.value)} rows={3}
            placeholder="House #, Road #, Area, Dhaka"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E8441A] resize-none text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date & Time *</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e: any) => setScheduledAt(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E8441A] text-sm" />
        </div>
        <button onClick={onNext} disabled={loading || !address || !scheduledAt}
          className="w-full bg-[#E8441A] hover:bg-[#C73610] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60">
          {loading ? 'Processing...' : 'Proceed to Payment →'}
        </button>
      </div>
    </div>
  )
}

function PaymentStep({ service, address, scheduledAt, orderId, onSuccess }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [processingStep, setProcessingStep] = useState('')

  const handlePay = async () => {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    try {
      setProcessingStep('Initializing secure payment...')
      const res = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: service.price, orderId, serviceTitle: service.title }),
      })
      const { clientSecret, error: apiError } = await res.json()
      if (apiError) { setError(apiError); setLoading(false); return }

      setProcessingStep('Validating card details...')
      await new Promise(r => setTimeout(r, 800))

      setProcessingStep('Authorizing payment...')
      const cardElement = elements.getElement(CardNumberElement)
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement! }
      })

      if (stripeError) { setError(stripeError.message || 'Payment failed'); setLoading(false); setProcessingStep(''); return }

      setProcessingStep('Confirming booking...')
      await new Promise(r => setTimeout(r, 500))

      // Only update order — NO transaction created here
      // Money is in admin's vault (Stripe account)
      const supabase = createClient()
      await supabase.from('orders').update({
        payment_status: 'paid',
        status: 'pending',
        stripe_payment_intent_id: paymentIntent?.id,
      }).eq('id', orderId)

      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      setProcessingStep('')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#635BFF]/10 rounded-xl flex items-center justify-center text-xl">💳</div>
        <div>
          <h2 className="text-xl font-black text-[#1A1A2E]">Secure Payment</h2>
          <p className="text-xs text-gray-400">Powered by Stripe — Test Mode</p>
        </div>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{service.title}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-medium text-right max-w-[200px]">{address}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Scheduled</span><span className="font-medium">{new Date(scheduledAt).toLocaleString('en-BD')}</span></div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
          <span>Total</span><span className="text-[#E8441A]">৳{service.price}</span>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
        <p className="font-semibold mb-1">🧪 Sandbox Test Mode</p>
        <p>Use test card: <span className="font-mono font-bold">4242 4242 4242 4242</span></p>
        <p>Expiry: any future date &nbsp;|&nbsp; CVV: any 3 digits</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
          <div className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#635BFF] transition-all">
            <CardNumberElement options={CARD_STYLE} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
            <div className="px-4 py-3.5 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#635BFF] transition-all">
              <CardExpiryElement options={CARD_STYLE} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
            <div className="px-4 py-3.5 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#635BFF] transition-all">
              <CardCvcElement options={CARD_STYLE} />
            </div>
          </div>
        </div>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">❌ {error}</div>}
      {loading && processingStep && (
        <div className="bg-[#635BFF]/5 border border-[#635BFF]/20 rounded-xl px-4 py-3 text-sm text-[#635BFF] flex items-center gap-2">
          <span className="animate-spin">⏳</span> {processingStep}
        </div>
      )}
      <button onClick={handlePay} disabled={loading || !stripe}
        className="w-full bg-[#635BFF] hover:bg-[#5147e5] text-white font-bold py-4 rounded-xl transition-all disabled:opacity-60 text-lg">
        {loading ? 'Processing...' : <>🔒 Pay ৳{service.price}</>}
      </button>
      <p className="text-center text-xs text-gray-400">Your payment is secured by Stripe. We never store your card details.</p>
    </div>
  )
}

function SuccessStep({ orderId, service }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto">✅</div>
      <div>
        <h2 className="text-2xl font-black text-[#1A1A2E]">Payment Successful!</h2>
        <p className="text-gray-500 mt-2">Your booking is confirmed. The vendor will contact you shortly.</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-left">
        <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium">{service.title}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Amount Paid</span><span className="font-bold text-green-600">৳{service.price}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Order ID</span><span className="font-mono text-xs text-[#E8441A]">{orderId.slice(0, 8).toUpperCase()}</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="text-yellow-600 font-medium">Awaiting vendor confirmation</span></div>
      </div>
      <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 text-left">
        💡 Once the vendor confirms and completes the job, mark it as done from your dashboard to release payment to vendor.
      </div>
      <div className="flex gap-3">
        <Link href="/user" className="flex-1 bg-[#E8441A] text-white font-bold py-3 rounded-xl text-center hover:bg-[#C73610] transition-all">View My Orders</Link>
        <Link href="/services" className="flex-1 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl text-center hover:bg-gray-50 transition-all">Browse More</Link>
      </div>
    </div>
  )
}

function CheckoutFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceId = searchParams.get('service')
  const [service, setService] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [address, setAddress] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details')
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      if (serviceId) {
        const { data: s } = await supabase
          .from('services')
          .select('*, vendor:profiles(full_name, phone), category:categories(name, icon)')
          .eq('id', serviceId).single()
        setService(s)
      }
    }
    load()
  }, [serviceId, router])

  const handleBookingNext = async () => {
    if (!address || !scheduledAt) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase.from('orders').insert({
      user_id: user!.id,
      service_id: service.id,
      vendor_id: service.vendor_id,
      total_amount: service.price,
      address,
      scheduled_at: scheduledAt,
      status: 'pending',
      payment_status: 'pending',
    }).select().single()
    if (!error && data) { setOrderId(data.id); setStep('payment') }
    setLoading(false)
  }

  if (!service) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center"><div className="text-4xl animate-spin mb-4">⚙️</div><p className="text-gray-500">Loading...</p></div>
    </div>
  )

  const steps = ['details', 'payment', 'success']
  const stepLabels = ['Booking', 'Payment', 'Confirmed']

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      <Navbar user={profile} />
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${i <= steps.indexOf(step) ? 'bg-[#E8441A] text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {i < steps.indexOf(step) ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium ${step === s ? 'text-[#E8441A]' : 'text-gray-400'}`}>{stepLabels[i]}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${i < steps.indexOf(step) ? 'bg-[#E8441A]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
        {step === 'details' && <BookingStep service={service} address={address} setAddress={setAddress} scheduledAt={scheduledAt} setScheduledAt={setScheduledAt} onNext={handleBookingNext} loading={loading} />}
        {step === 'payment' && <Elements stripe={stripePromise}><PaymentStep service={service} address={address} scheduledAt={scheduledAt} orderId={orderId} onSuccess={() => setStep('success')} /></Elements>}
        {step === 'success' && <SuccessStep orderId={orderId} service={service} />}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin text-4xl">⚙️</div></div>}><CheckoutFlow /></Suspense>
}