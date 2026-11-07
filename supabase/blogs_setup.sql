-- Varanasi Connect optional blog feature.
-- Apply only after explicit approval. Creates new isolated tables and one public image bucket.
-- Existing events, reviews, accounts, registrations, and uploaded media are not changed.

create table if not exists public.vc_blog_settings (
  id smallint primary key default 1 check (id = 1),
  blogs_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.vc_blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 100),
  category text not null default 'Varanasi' check (char_length(category) <= 50),
  author_name text not null default 'Varanasi Connect' check (char_length(author_name) <= 80),
  excerpt text not null check (char_length(excerpt) between 1 and 240),
  body text not null check (char_length(body) between 1 and 30000),
  cover_image_url text,
  cover_image_alt text check (cover_image_alt is null or char_length(cover_image_alt) <= 180),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  meta_description text check (meta_description is null or char_length(meta_description) <= 180),
  source_links jsonb not null default '[]'::jsonb check (jsonb_typeof(source_links) = 'array'),
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists vc_blog_posts_published_idx on public.vc_blog_posts (published_at desc) where status = 'published';
alter table public.vc_blog_posts enable row level security;
alter table public.vc_blog_settings enable row level security;
grant select on public.vc_blog_posts to anon, authenticated;
grant insert, update, delete on public.vc_blog_posts to authenticated;
grant select on public.vc_blog_settings to anon, authenticated;
grant update on public.vc_blog_settings to authenticated;

drop policy if exists "Anyone can read published blog posts" on public.vc_blog_posts;
create policy "Anyone can read published blog posts" on public.vc_blog_posts for select to anon using (status = 'published');
drop policy if exists "Signed in users can read published posts and admins can read all" on public.vc_blog_posts;
create policy "Signed in users can read published posts and admins can read all" on public.vc_blog_posts for select to authenticated
  using (status = 'published' or exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())));
drop policy if exists "VC admins can create blog posts" on public.vc_blog_posts;
create policy "VC admins can create blog posts" on public.vc_blog_posts for insert to authenticated
  with check (exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())));
drop policy if exists "VC admins can update blog posts" on public.vc_blog_posts;
create policy "VC admins can update blog posts" on public.vc_blog_posts for update to authenticated
  using (exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())));
drop policy if exists "VC admins can delete blog posts" on public.vc_blog_posts;
create policy "VC admins can delete blog posts" on public.vc_blog_posts for delete to authenticated
  using (exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())));

drop policy if exists "Anyone can read blog visibility" on public.vc_blog_settings;
create policy "Anyone can read blog visibility" on public.vc_blog_settings for select to anon, authenticated using (true);
drop policy if exists "VC admins can change blog visibility" on public.vc_blog_settings;
create policy "VC admins can change blog visibility" on public.vc_blog_settings for update to authenticated
  using (exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())));

insert into public.vc_blog_settings(id, blogs_enabled) values (1, true) on conflict (id) do nothing;

insert into public.vc_blog_posts(slug,title,category,excerpt,body,cover_image_url,cover_image_alt,author_name,source_links,seo_title,meta_description,status,published_at)
values
('a-walk-along-the-varanasi-ghats','A thoughtful walk along the Varanasi ghats','Places & culture','The riverfront is more than a postcard view. Here is a simple way to explore it with curiosity and respect.','Varanasi’s ghats are broad stone steps that meet the Ganga. The District Varanasi administration describes 88 ghats, with many used for bathing and puja. Each stretch of riverfront has its own rhythm, so a walk is best approached as a series of small observations rather than a checklist.

Start early if you want a quieter view of the river and the city waking up. Walk at an unhurried pace, leave room for residents to go about their routines, and ask before photographing people. If you take a boat, agree on the route and price before setting off.

The ghats are living public and religious spaces. Dress and behave respectfully, follow signs and local guidance, and keep a safe distance from ceremonies. A little patience makes the experience richer for visitors and more considerate for the people who live here.','https://cdn.s3waas.gov.in/s36da37dd3139aa4d9aa55b8d237ec5d4a/uploads/2018/04/2018040927.jpg','The Ganga riverfront and ghats in Varanasi','Varanasi Connect','[{"title":"District Varanasi — Ganga Ghat","url":"https://varanasi.nic.in/tourist-place/ganga-ghat/"}]'::jsonb,'A respectful guide to walking the Varanasi ghats','Explore Varanasi’s Ganga riverfront thoughtfully, with practical tips for a calm and respectful ghat walk.','published',now()),
('sarnath-a-day-trip-from-varanasi','Sarnath: a calm day trip from Varanasi','Nearby places','A little planning helps make a visit to Sarnath more meaningful, comfortable and respectful.','Sarnath is a historic Buddhist pilgrimage site northeast of Varanasi. The District Varanasi administration places it about 10 kilometres from the city. It can feel very different from the bustle of the old city, so plan enough time to move slowly between the site and its museum or other nearby stops.

Check opening hours, visitor rules and transport before you leave; these can change. Carry water, use marked paths, and be mindful that people visit to pray and reflect. If you are travelling during a busy period, leave extra time for the road journey.

Rather than trying to fit in every stop, choose a few places that interest you and give each one your attention. The quieter pace is part of what makes Sarnath a memorable counterpoint to a day in central Varanasi.','https://cdn.s3waas.gov.in/s36da37dd3139aa4d9aa55b8d237ec5d4a/uploads/2018/08/2018080841.jpg','A historic monument at Sarnath near Varanasi','Varanasi Connect','[{"title":"District Varanasi — Sarnath","url":"https://varanasi.nic.in/tourist-place/sarnath/"}]'::jsonb,'Planning a thoughtful day trip to Sarnath from Varanasi','A practical, respectful guide to visiting Sarnath from Varanasi, with planning tips and official visitor information.','published',now()),
('a-quiet-corner-of-bhu-varanasi','A quiet corner of BHU in Varanasi','Campus & city','Banaras Hindu University offers a different pace from the lanes and ghats. Here is what to know before you visit.','Banaras Hindu University is a major part of Varanasi’s academic and cultural life. The university’s published materials describe a large campus with faculties, institutes, gardens and the Shri Vishwanath Temple. For visitors, that scale is a reason to plan ahead instead of assuming every part of the campus is open to casual sightseeing.

Check current visitor guidance and access rules before travelling. Keep to public areas, respect classes and campus residents, and follow any directions from university staff. If you are visiting the temple, be mindful of worshippers and its posted rules.

The contrast between a busy city street and a green campus path can make BHU a refreshing stop. Treat it as a working university first, and a place to explore only where visitors are welcome.','/assets/varanasi/culture/Bhu%20temple.jpg','Temple architecture on the Banaras Hindu University campus','Varanasi Connect','[{"title":"Banaras Hindu University","url":"https://www.bhu.ac.in/"}]'::jsonb,'Visiting Banaras Hindu University in Varanasi','A considerate visitor’s guide to BHU’s campus, public areas and Shri Vishwanath Temple in Varanasi.','published',now())
on conflict (slug) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('vc-blog-media','vc-blog-media',true,8388608,array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
drop policy if exists "Public can view blog cover images" on storage.objects;
create policy "Public can view blog cover images" on storage.objects for select to anon, authenticated using (bucket_id = 'vc-blog-media');
drop policy if exists "VC admins can upload blog cover images" on storage.objects;
create policy "VC admins can upload blog cover images" on storage.objects for insert to authenticated
  with check (bucket_id = 'vc-blog-media' and exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())));
drop policy if exists "VC admins can update blog cover images" on storage.objects;
create policy "VC admins can update blog cover images" on storage.objects for update to authenticated
  using (bucket_id = 'vc-blog-media' and exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())))
  with check (bucket_id = 'vc-blog-media' and exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())));
drop policy if exists "VC admins can delete blog cover images" on storage.objects;
create policy "VC admins can delete blog cover images" on storage.objects for delete to authenticated
  using (bucket_id = 'vc-blog-media' and exists (select 1 from public.vc_admins a where a.user_id = (select auth.uid())));
