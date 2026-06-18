-- ============================================================
-- LOK LAGBE? — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  phone text,
  role text not null default 'user' check (role in ('admin', 'vendor', 'user')),
  created_at timestamptz default now()
);

-- 2. CATEGORIES
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text not null,
  description text,
  created_at timestamptz default now()
);

-- 3. SERVICES (listed by vendors)
create table public.services (
  id uuid default gen_random_uuid() primary key,
  vendor_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) not null,
  title text not null,
  description text not null,
  price numeric(10,2) not null,
  price_unit text not null default 'per job',
  is_available boolean default true,
  created_at timestamptz default now()
);

-- 4. ORDERS (bookings by users)
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  service_id uuid references public.services(id) not null,
  vendor_id uuid references public.profiles(id) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  total_amount numeric(10,2) not null,
  address text not null,
  scheduled_at timestamptz not null,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  payment_method text default 'mock_payment',
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.orders enable row level security;

-- PROFILES policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- CATEGORIES policies (public read, admin write)
create policy "Anyone can view categories"
  on public.categories for select using (true);

create policy "Admins can manage categories"
  on public.categories for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- SERVICES policies
create policy "Anyone can view available services"
  on public.services for select using (true);

create policy "Vendors can manage their own services"
  on public.services for all using (auth.uid() = vendor_id);

create policy "Admins can manage all services"
  on public.services for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ORDERS policies
create policy "Users can view their own orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "Vendors can view orders for their services"
  on public.orders for select using (auth.uid() = vendor_id);

create policy "Admins can view all orders"
  on public.orders for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can create orders"
  on public.orders for insert with check (auth.uid() = user_id);

create policy "Vendors can update order status"
  on public.orders for update using (auth.uid() = vendor_id);

create policy "Admins can update all orders"
  on public.orders for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SEED DATA — Categories
-- ============================================================
insert into public.categories (name, icon, description) values
  ('Plumbing', '🔧', 'Fix leaks, pipes, taps and water issues'),
  ('Electrical', '⚡', 'Wiring, switches, fan installation and electrical repairs'),
  ('Cleaning', '🧹', 'Home and office deep cleaning services'),
  ('AC Service', '❄️', 'AC installation, cleaning and repair'),
  ('Painting', '🎨', 'Wall painting, interior and exterior'),
  ('Carpentry', '🪚', 'Furniture repair, door fixing and woodwork'),
  ('Appliance Repair', '🔌', 'TV, fridge, washing machine repairs'),
  ('Security', '🔒', 'CCTV installation and security setup');
