import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2026-05-27.dahlia' as any,
        })

        const { amount, orderId, serviceTitle } = await req.json()

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'usd',
            metadata: {
                orderId,
                serviceTitle,
                platform: 'lok-lagbe',
                original_currency: 'BDT',
                original_amount: amount.toString(),
            },
            description: `Lok Lagbe? — ${serviceTitle}`,
        })

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        })
    } catch (error: any) {
        console.error('Stripe error:', error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}