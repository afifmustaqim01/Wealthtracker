-- Enable pgvector extension
create extension if not exists vector;

-- Posts Table
create table if not exists public.posts (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references auth.users(id) on delete cascade,
    title varchar(160) not null,
    body text not null,
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Post Chunks Table with 768-dimensional embeddings for Gemini text-embedding-004
create table if not exists public.post_chunks (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references public.posts(id) on delete cascade,
    chunk_index integer not null,
    chunk_text text not null,
    embedding vector(768) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.posts enable row level security;
alter table public.post_chunks enable row level security;

-- Policies for posts
create policy "Allow public read access" on public.posts
    for select using (true);

create policy "Allow authenticated insert" on public.posts
    for insert with check (auth.uid() = author_id);

create policy "Allow author update" on public.posts
    for update using (auth.uid() = author_id);

create policy "Allow author delete" on public.posts
    for delete using (auth.uid() = author_id);

-- Policies for post chunks
create policy "Allow public read chunks" on public.post_chunks
    for select using (true);

-- Storage bucket setup for post-images
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "Public Access to post images" on storage.objects
    for select using (bucket_id = 'post-images');

create policy "Authenticated users can upload post images" on storage.objects
    for insert with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

create policy "Users can update and delete their own images" on storage.objects
    for all using (bucket_id = 'post-images' and auth.uid() = owner);