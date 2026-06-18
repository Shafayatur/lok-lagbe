export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import type { Profile, Service, Category } from '@/types'

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: Profile | null = null
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    profile = data
  }

  const { data: categories } = await supabase.from('categories').select('*')

  let query = supabase
    .from('services')
    .select('*, vendor:profiles(full_name, phone), category:categories(name, icon)')
    .eq('is_available', true)

  if (params.category) query = query.eq('category_id', params.category)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const { data: services } = await query

  return (
    <div className="min-h-screen bg-[#F8F6F3]">
      <Navbar user={profile} />

      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black text-[#1A1A2E] mb-2">Browse Services</h1>
        <p className="text-gray-500 mb-8">Find trusted professionals for any home job</p>

        {/* Search + Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-8 flex flex-col md:flex-row gap-4">
          <form className="flex-1 flex gap-3">
            <input name="q" defaultValue={params.q} placeholder="Search services..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E8441A] text-sm" />
            <button type="submit" className="bg-[#E8441A] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#C73610] transition-all">
              Search
            </button>
          </form>
          <div className="flex gap-2 flex-wrap">
            <Link href="/services" className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${!params.category ? 'bg-[#E8441A] text-white border-[#E8441A]' : 'border-gray-200 text-gray-600 hover:border-[#E8441A]'}`}>
              All
            </Link>
            {(categories || []).map((cat: Category) => (
              <Link key={cat.id} href={`/services?category=${cat.id}`}
                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${params.category === cat.id ? 'bg-[#E8441A] text-white border-[#E8441A]' : 'border-gray-200 text-gray-600 hover:border-[#E8441A]'}`}>
                {cat.icon} {cat.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {(!services || services.length === 0) ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg font-medium">No services found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: Service & { vendor?: any; category?: any }) => (
              <div key={service.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md hover:-translate-y-1 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-medium text-[#E8441A] bg-[#E8441A]/10 px-2.5 py-1 rounded-full">
                      {service.category?.icon} {service.category?.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-[#1A1A2E]">৳{service.price}</div>
                    <div className="text-xs text-gray-400">{service.price_unit}</div>
                  </div>
                </div>
                <h3 className="font-bold text-[#1A1A2E] text-lg mb-2">{service.title}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    👤 {service.vendor?.full_name}
                  </div>
                  {user ? (
                    <Link href={`/checkout?service=${service.id}`}
                      className="bg-[#E8441A] hover:bg-[#C73610] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all">
                      Book Now
                    </Link>
                  ) : (
                    <Link href="/login"
                      className="bg-[#E8441A] hover:bg-[#C73610] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all">
                      Login to Book
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
