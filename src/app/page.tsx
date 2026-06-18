export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import type { Profile, Category } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: categories } = await supabase.from('categories').select('*').limit(8)

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      <Navbar user={profile} />

      {/* Hero */}
      <section className="bg-[#1A1A2E] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-[#E8441A]/20 text-[#F5A623] text-sm font-semibold px-4 py-2 rounded-full mb-6">
            🇧🇩 Bangladesh&apos;s Home Service Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
            লোক লাগবে?<br />
            <span className="text-[#E8441A]">We&apos;ve got you.</span>
          </h1>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Trusted professionals for plumbing, electrical, cleaning and more — at your doorstep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/services" className="bg-[#E8441A] hover:bg-[#C73610] text-white font-bold px-8 py-4 rounded-xl transition-all text-lg active:scale-95">
              Find a Service
            </Link>
            <Link href="/signup?role=vendor" className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-4 rounded-xl transition-all text-lg border border-white/20">
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#E8441A] py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center text-white">
          {[['500+', 'Verified Professionals'], ['8', 'Service Categories'], ['4.8★', 'Average Rating']].map(([num, label]) => (
            <div key={label}>
              <div className="text-3xl font-black">{num}</div>
              <div className="text-white/80 text-sm mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-[#1A1A2E] mb-2">Our Services</h2>
          <p className="text-gray-500 mb-10">Professional help for every home need</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(categories || []).map((cat: Category) => (
              <Link
                key={cat.id}
                href={`/services?category=${cat.id}`}
                className="bg-white rounded-2xl p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all border border-gray-100 group"
              >
                <div className="text-4xl mb-3">{cat.icon}</div>
                <div className="font-bold text-[#1A1A2E] group-hover:text-[#E8441A] transition-colors">{cat.name}</div>
                <div className="text-xs text-gray-400 mt-1">{cat.description}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-[#1A1A2E] mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '🔍', title: 'Browse Services', desc: 'Search by category or service type' },
              { step: '2', icon: '📅', title: 'Book & Pay', desc: 'Schedule at your convenience, pay securely' },
              { step: '3', icon: '✅', title: 'Get it Done', desc: 'Professional arrives and completes the job' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-[#E8441A]/10 rounded-2xl flex items-center justify-center text-2xl mb-4">{icon}</div>
                <div className="w-8 h-8 bg-[#E8441A] rounded-full flex items-center justify-center text-white font-black text-sm mb-3">{step}</div>
                <h3 className="font-bold text-[#1A1A2E] text-lg mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#1A1A2E]">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl font-black mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8">Join thousands of happy customers across Bangladesh</p>
          <Link href="/signup" className="bg-[#E8441A] hover:bg-[#C73610] text-white font-bold px-10 py-4 rounded-xl transition-all text-lg inline-block">
            Create Free Account
          </Link>
        </div>
      </section>

      <footer className="bg-[#0F0F1A] text-gray-500 py-8 px-4 text-center text-sm">
        <p>© 2025 Lok Lagbe? | লোক লাগবে? — All rights reserved</p>
      </footer>
    </div>
  )
}
