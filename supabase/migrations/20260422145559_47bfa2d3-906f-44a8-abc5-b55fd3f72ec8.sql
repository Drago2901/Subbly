-- Profiles
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- Shared updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled project',
  captions jsonb not null default '[]'::jsonb,
  style jsonb not null default '{}'::jsonb,
  source_video_path text,
  source_video_name text,
  source_video_mime text,
  exported_video_path text,
  duration_seconds numeric,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

create index projects_user_id_updated_at_idx
  on public.projects (user_id, updated_at desc);

create trigger update_projects_updated_at
before update on public.projects
for each row execute function public.update_updated_at_column();

-- Storage buckets (private)
insert into storage.buckets (id, name, public)
values ('project-videos', 'project-videos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('project-exports', 'project-exports', false)
on conflict (id) do nothing;

-- Storage policies: each user can only access files inside a folder named after their user id
create policy "Users can read their own project videos"
  on storage.objects for select
  using (
    bucket_id = 'project-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload their own project videos"
  on storage.objects for insert
  with check (
    bucket_id = 'project-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own project videos"
  on storage.objects for update
  using (
    bucket_id = 'project-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own project videos"
  on storage.objects for delete
  using (
    bucket_id = 'project-videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their own project exports"
  on storage.objects for select
  using (
    bucket_id = 'project-exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload their own project exports"
  on storage.objects for insert
  with check (
    bucket_id = 'project-exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own project exports"
  on storage.objects for update
  using (
    bucket_id = 'project-exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own project exports"
  on storage.objects for delete
  using (
    bucket_id = 'project-exports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );