-- Table for storing API configurations per user
create table public.api_configurations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  base_url text not null,
  bearer_token text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, name)
);

-- Table for storing API endpoints per user
create table public.api_endpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  config_id uuid references public.api_configurations(id) on delete cascade,
  name text not null,
  method text not null check (method in ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')),
  path text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.api_configurations enable row level security;
alter table public.api_endpoints enable row level security;

-- RLS Policies for api_configurations
create policy "Users can view their own API configs"
  on public.api_configurations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own API configs"
  on public.api_configurations for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own API configs"
  on public.api_configurations for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own API configs"
  on public.api_configurations for delete
  to authenticated
  using (auth.uid() = user_id);

-- RLS Policies for api_endpoints
create policy "Users can view their own endpoints"
  on public.api_endpoints for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own endpoints"
  on public.api_endpoints for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own endpoints"
  on public.api_endpoints for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete their own endpoints"
  on public.api_endpoints for delete
  to authenticated
  using (auth.uid() = user_id);

-- Trigger function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add triggers for updated_at
create trigger update_api_configurations_updated_at
  before update on public.api_configurations
  for each row
  execute function public.update_updated_at_column();

create trigger update_api_endpoints_updated_at
  before update on public.api_endpoints
  for each row
  execute function public.update_updated_at_column();