-- ============================================
-- Quantum Quarters - Supabase Database Schema
-- Run this in your Supabase SQL editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- CLIENTS TABLE
-- ============================================
create table if not exists clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text default '',
  email text default '',
  property text default '',
  notes text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
create table if not exists payments (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  amount numeric(12, 2) not null default 0,
  payment_date date not null default current_date,
  method text check (method in ('Cash', 'Bank Transfer', 'Mobile Money')) not null default 'Cash',
  status text check (status in ('Deposit', 'Partial', 'Full')) not null default 'Deposit',
  notes text default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
create table if not exists documents (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  payment_id uuid references payments(id) on delete set null,
  name text not null,
  type text check (type in ('Receipt', 'Agreement', 'Identification', 'Property', 'Other')) not null default 'Other',
  file_path text not null,
  file_size bigint not null default 0,
  mime_type text not null default '',
  created_at timestamptz default now() not null
);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists clients_name_idx on clients(name);
create index if not exists payments_client_id_idx on payments(client_id);
create index if not exists payments_date_idx on payments(payment_date desc);
create index if not exists documents_client_id_idx on documents(client_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();

create trigger payments_updated_at before update on payments
  for each row execute function update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on all tables
alter table clients enable row level security;
alter table payments enable row level security;
alter table documents enable row level security;

-- Allow authenticated users full access
create policy "Authenticated users can do everything on clients"
  on clients for all to authenticated using (true) with check (true);

create policy "Authenticated users can do everything on payments"
  on payments for all to authenticated using (true) with check (true);

create policy "Authenticated users can do everything on documents"
  on documents for all to authenticated using (true) with check (true);

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Create storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload/download
create policy "Authenticated users can upload documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents');

create policy "Authenticated users can read documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents');

create policy "Authenticated users can delete documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents');
