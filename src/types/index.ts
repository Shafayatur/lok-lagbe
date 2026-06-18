export type UserRole = 'admin' | 'vendor' | 'user'

export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  created_at: string
}

export interface Category {
  id: string
  name: string
  icon: string
  description: string
}

export interface Service {
  id: string
  vendor_id: string
  category_id: string
  title: string
  description: string
  price: number
  price_unit: string // 'per hour' | 'per job' | 'per visit'
  is_available: boolean
  created_at: string
  // joined
  vendor?: Profile
  category?: Category
}

export interface Order {
  id: string
  user_id: string
  service_id: string
  vendor_id: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  total_amount: number
  address: string
  scheduled_at: string
  payment_status: 'pending' | 'paid'
  payment_method: string
  created_at: string
  // joined
  service?: Service
  user?: Profile
}
