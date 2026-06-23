-- Combined Supabase migrations 0001 through 0009.
-- Safe to paste into the Supabase SQL Editor.

-- 0001_extensions_and_enums.sql
create extension if not exists pgcrypto;
do $$ begin create type admin_role as enum ('super_admin','editor','viewer'); exception when duplicate_object then null; end $$;
do $$ begin create type content_status as enum ('draft','published','unpublished','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type lead_status as enum ('new','contacted','qualified','closed'); exception when duplicate_object then null; end $$;
do $$ begin create type ask_jar_status as enum ('new','reviewed','flagged','converted_to_lead','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type subscriber_status as enum ('active','unsubscribed','bounced','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type analytics_event_type as enum ('page_view','cta_click','ask_jar_submission','insight_view','contact_form_submission','newsletter_signup','case_study_view','ask_jar_conversation_started','ask_jar_message_submitted','ask_jar_lead_captured'); exception when duplicate_object then null; end $$;
do $$ begin create type audit_action_type as enum ('create','update','delete','publish','unpublish','archive','restore','login','logout','role_change','user_invite','user_disable','upload'); exception when duplicate_object then null; end $$;

-- 0002_admin_users.sql
create table if not exists admin_users(id uuid primary key default gen_random_uuid(),auth_user_id uuid unique references auth.users(id),email text not null unique,full_name text,role admin_role not null default 'viewer',is_active boolean not null default true,last_login_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create or replace function is_admin() returns boolean language sql security definer stable set search_path=public as $$ select exists(select 1 from admin_users where auth_user_id=auth.uid() and is_active) $$;
create or replace function current_admin_role() returns admin_role language sql security definer stable set search_path=public as $$ select role from admin_users where auth_user_id=auth.uid() and is_active limit 1 $$;
create or replace function is_super_admin() returns boolean language sql security definer stable set search_path=public as $$ select current_admin_role()='super_admin'::admin_role $$;
create or replace function is_editor_or_above() returns boolean language sql security definer stable set search_path=public as $$ select current_admin_role() in ('super_admin'::admin_role,'editor'::admin_role) $$;
create or replace function is_viewer_or_above() returns boolean language sql security definer stable set search_path=public as $$ select current_admin_role() in ('super_admin'::admin_role,'editor'::admin_role,'viewer'::admin_role) $$;

-- 0003_media_cms_navigation_seo.sql
create table if not exists media_assets(id uuid primary key default gen_random_uuid(),bucket text not null,path text not null,public_url text,filename text not null,mime_type text not null,size_bytes bigint,width integer,height integer,alt_text text,caption text,uploaded_by uuid references admin_users(id),metadata jsonb default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),archived_at timestamptz,unique(bucket,path));
create table if not exists site_sections(id uuid primary key default gen_random_uuid(),section_key text not null unique,title text,eyebrow text,headline text,subheadline text,body jsonb default '{}',primary_cta_label text,primary_cta_href text,secondary_cta_label text,secondary_cta_href text,media_id uuid references media_assets(id),status content_status not null default 'draft',published_at timestamptz,sort_order integer default 0,created_by uuid references admin_users(id),updated_by uuid references admin_users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists navigation_items(id uuid primary key default gen_random_uuid(),label text not null,href text not null,location text not null,parent_id uuid references navigation_items(id),sort_order integer not null default 0,opens_in_new_tab boolean not null default false,status content_status not null default 'published',created_by uuid references admin_users(id),updated_by uuid references admin_users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists seo_entries(id uuid primary key default gen_random_uuid(),route_path text unique,entity_type text,entity_id uuid,title text,description text,canonical_url text,og_title text,og_description text,og_image_media_id uuid references media_assets(id),twitter_title text,twitter_description text,twitter_image_media_id uuid references media_assets(id),noindex boolean not null default false,nofollow boolean not null default false,metadata jsonb default '{}',created_by uuid references admin_users(id),updated_by uuid references admin_users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now());

-- 0004_content_models.sql
create table if not exists expertise_items(id uuid primary key default gen_random_uuid(),title text not null,slug text not null unique,summary text,description jsonb default '{}',icon_key text,icon_media_id uuid references media_assets(id),cover_media_id uuid references media_assets(id),sort_order integer not null default 0,is_featured boolean not null default false,status content_status not null default 'draft',seo_title text,seo_description text,seo_image_media_id uuid references media_assets(id),created_by uuid references admin_users(id),updated_by uuid references admin_users(id),published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists sectors(id uuid primary key default gen_random_uuid(),title text not null,slug text not null unique,summary text,description jsonb default '{}',icon_key text,icon_media_id uuid references media_assets(id),cover_media_id uuid references media_assets(id),sort_order integer not null default 0,is_featured boolean not null default false,status content_status not null default 'draft',seo_title text,seo_description text,seo_image_media_id uuid references media_assets(id),created_by uuid references admin_users(id),updated_by uuid references admin_users(id),published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists engagements(id uuid primary key default gen_random_uuid(),title text not null,slug text not null unique,summary text,description jsonb default '{}',sector_id uuid references sectors(id),image_media_id uuid references media_assets(id),engagement_status text,sort_order integer not null default 0,is_featured boolean not null default false,status content_status not null default 'draft',seo_title text,seo_description text,seo_image_media_id uuid references media_assets(id),created_by uuid references admin_users(id),updated_by uuid references admin_users(id),published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists case_studies(id uuid primary key default gen_random_uuid(),title text not null,slug text not null unique,summary text,content jsonb default '{}',cover_media_id uuid references media_assets(id),sector_id uuid references sectors(id),client_name text,engagement_id uuid references engagements(id),featured boolean not null default false,status content_status not null default 'draft',seo_title text,seo_description text,seo_image_media_id uuid references media_assets(id),created_by uuid references admin_users(id),updated_by uuid references admin_users(id),published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists insights(id uuid primary key default gen_random_uuid(),title text not null,slug text not null unique,summary text,content jsonb default '{}',cover_media_id uuid references media_assets(id),author_name text,author_title text,published_date date,category text,sector_id uuid references sectors(id),status content_status not null default 'draft',is_featured boolean not null default false,seo_title text,seo_description text,seo_image_media_id uuid references media_assets(id),created_by uuid references admin_users(id),updated_by uuid references admin_users(id),published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists metrics(id uuid primary key default gen_random_uuid(),label text not null,value text not null,description text,icon_key text,sort_order integer not null default 0,status content_status not null default 'draft',created_by uuid references admin_users(id),updated_by uuid references admin_users(id),published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists leadership_profiles(id uuid primary key default gen_random_uuid(),name text not null,title text,biography jsonb default '{}',profile_image_media_id uuid references media_assets(id),linkedin_url text,sort_order integer not null default 0,status content_status not null default 'draft',created_by uuid references admin_users(id),updated_by uuid references admin_users(id),published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());

-- 0005_leads_ask_jar_conversations_subscribers.sql
create table if not exists ask_jar_prompts(id uuid primary key default gen_random_uuid(),prompt text not null,category text,sort_order integer not null default 0,status content_status not null default 'draft',created_by uuid references admin_users(id),updated_by uuid references admin_users(id),published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists ask_jar_conversations(id uuid primary key default gen_random_uuid(),conversation_code text unique,title text,status text not null default 'active',lead_id uuid,contact_name text,contact_email text,contact_company text,lead_capture_completed boolean not null default false,source text not null default 'ask_jar',utm_source text,utm_medium text,utm_campaign text,referrer text,landing_page text,device_type text,ip_hash text,user_agent text,metadata jsonb default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),last_message_at timestamptz,archived_at timestamptz);
create table if not exists ask_jar_messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references ask_jar_conversations(id) on delete cascade,role text not null check(role in ('user','assistant','system','lead_capture')),content text not null,content_format text not null default 'text',sequence integer not null,status text not null default 'complete',metadata jsonb default '{}',created_at timestamptz not null default now(),unique(conversation_id,sequence));
create table if not exists leads(id uuid primary key default gen_random_uuid(),name text not null,email text not null,company text,phone text,message text,source text not null,status lead_status not null default 'new',notes text,ask_jar_conversation_id uuid references ask_jar_conversations(id),utm_source text,utm_medium text,utm_campaign text,referrer text,landing_page text,device_type text,ip_hash text,user_agent text,metadata jsonb default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
do $$ begin alter table ask_jar_conversations add constraint ask_jar_conversations_lead_id_fkey foreign key (lead_id) references leads(id); exception when duplicate_object then null; end $$;
create table if not exists ask_jar_lead_events(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references ask_jar_conversations(id) on delete cascade,lead_id uuid references leads(id),event_type text not null,field_key text,field_value text,metadata jsonb default '{}',created_at timestamptz not null default now());
create table if not exists ask_jar_queries(id uuid primary key default gen_random_uuid(),conversation_id uuid references ask_jar_conversations(id),query text not null,contact_name text,contact_email text,contact_company text,lead_id uuid references leads(id),lead_status lead_status,status ask_jar_status default 'new',is_flagged boolean default false,admin_notes text,utm_source text,utm_medium text,utm_campaign text,referrer text,landing_page text,device_type text,ip_hash text,user_agent text,metadata jsonb default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists subscribers(id uuid primary key default gen_random_uuid(),email text not null unique,name text,source text,status subscriber_status not null default 'active',utm_source text,utm_medium text,utm_campaign text,referrer text,metadata jsonb default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unsubscribed_at timestamptz);

-- 0006_analytics_audit_logs.sql
create table if not exists analytics_events(id uuid primary key default gen_random_uuid(),event_type analytics_event_type not null,page_path text,entity_type text,entity_id uuid,cta_label text,device_type text,traffic_source text,referrer text,utm_source text,utm_medium text,utm_campaign text,session_id text,ip_hash text,user_agent text,metadata jsonb default '{}',created_at timestamptz not null default now());
create table if not exists audit_logs(id uuid primary key default gen_random_uuid(),admin_user_id uuid references admin_users(id),action audit_action_type not null,entity_type text not null,entity_id uuid,before_data jsonb,after_data jsonb,ip_hash text,user_agent text,metadata jsonb default '{}',created_at timestamptz not null default now());

-- 0007_rls_policies.sql
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['admin_users','media_assets','site_sections','navigation_items','seo_entries','expertise_items','sectors','engagements','case_studies','insights','metrics','leadership_profiles','ask_jar_prompts','ask_jar_conversations','ask_jar_messages','ask_jar_lead_events','leads','ask_jar_queries','subscribers','analytics_events','audit_logs']
  LOOP
    EXECUTE format('alter table %I enable row level security', t);
  END LOOP;
END $$;

drop policy if exists "public media read" on media_assets;
create policy "public media read" on media_assets for select using (bucket='public-media' and archived_at is null);
drop policy if exists "admin media read" on media_assets;
create policy "admin media read" on media_assets for select using (is_viewer_or_above());
drop policy if exists "editor media write" on media_assets;
create policy "editor media write" on media_assets for all using (is_editor_or_above()) with check (is_editor_or_above());
drop policy if exists "admin users self read" on admin_users;
create policy "admin users self read" on admin_users for select using (auth.uid()=auth_user_id or is_super_admin());
drop policy if exists "super admin users write" on admin_users;
create policy "super admin users write" on admin_users for all using (is_super_admin()) with check (is_super_admin());

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['site_sections','navigation_items','expertise_items','sectors','engagements','case_studies','insights','metrics','leadership_profiles','ask_jar_prompts']
  LOOP
    EXECUTE format('drop policy if exists "public published read" on %I', t);
    EXECUTE format('create policy "public published read" on %I for select using (status = ''published'')', t);
    EXECUTE format('drop policy if exists "admin read" on %I', t);
    EXECUTE format('create policy "admin read" on %I for select using (is_viewer_or_above())', t);
    EXECUTE format('drop policy if exists "editor draft write" on %I', t);
    EXECUTE format('create policy "editor draft write" on %I for insert with check (is_editor_or_above() and status <> ''published'')', t);
    EXECUTE format('drop policy if exists "editor draft update" on %I', t);
    EXECUTE format('create policy "editor draft update" on %I for update using (is_editor_or_above()) with check ((is_super_admin()) or status <> ''published'')', t);
  END LOOP;
END $$;

drop policy if exists "public seo read" on seo_entries;
create policy "public seo read" on seo_entries for select using (noindex=false);
drop policy if exists "admin seo read" on seo_entries;
create policy "admin seo read" on seo_entries for select using (is_viewer_or_above());
drop policy if exists "editor seo write" on seo_entries;
create policy "editor seo write" on seo_entries for all using (is_editor_or_above()) with check (is_editor_or_above());
drop policy if exists "admin private read conversations" on ask_jar_conversations;
create policy "admin private read conversations" on ask_jar_conversations for select using (is_viewer_or_above());
drop policy if exists "admin private read messages" on ask_jar_messages;
create policy "admin private read messages" on ask_jar_messages for select using (is_viewer_or_above());
drop policy if exists "admin private read lead events" on ask_jar_lead_events;
create policy "admin private read lead events" on ask_jar_lead_events for select using (is_viewer_or_above());
drop policy if exists "admin private read leads" on leads;
create policy "admin private read leads" on leads for select using (is_viewer_or_above());
drop policy if exists "admin update leads" on leads;
create policy "admin update leads" on leads for update using (is_editor_or_above()) with check (is_editor_or_above());
drop policy if exists "admin read analytics" on analytics_events;
create policy "admin read analytics" on analytics_events for select using (is_viewer_or_above());
drop policy if exists "super admin read audit" on audit_logs;
create policy "super admin read audit" on audit_logs for select using (is_super_admin());

-- 0008_storage_buckets.sql
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('public-media','public-media',true,10485760,array['image/jpeg','image/png','image/webp','image/svg+xml']) on conflict (id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit) values('admin-private','admin-private',false,26214400) on conflict (id) do nothing;
drop policy if exists "public media storage read" on storage.objects;
create policy "public media storage read" on storage.objects for select using (bucket_id='public-media');
drop policy if exists "admin public media upload" on storage.objects;
create policy "admin public media upload" on storage.objects for insert with check (bucket_id='public-media' and is_editor_or_above());
drop policy if exists "admin public media update" on storage.objects;
create policy "admin public media update" on storage.objects for update using (bucket_id='public-media' and is_editor_or_above());
drop policy if exists "super admin public media delete" on storage.objects;
create policy "super admin public media delete" on storage.objects for delete using (bucket_id='public-media' and is_super_admin());
drop policy if exists "admin private storage read" on storage.objects;
create policy "admin private storage read" on storage.objects for select using (bucket_id='admin-private' and is_viewer_or_above());
drop policy if exists "admin private storage upload" on storage.objects;
create policy "admin private storage upload" on storage.objects for insert with check (bucket_id='admin-private' and is_editor_or_above());

-- 0009_seed_phase_1_content.sql
insert into navigation_items(label,href,location,sort_order,status) values
('Expertise','/expertise','header',1,'published'),('Sectors','/sectors','header',2,'published'),('Intelligence','/intelligence','header',3,'published'),('Ask JAR','/ask-jar','header',4,'published'),('About Us','/about','header',5,'published'),('Contact','/contact','header',6,'published') on conflict do nothing;
insert into expertise_items(title,slug,summary,icon_key,sort_order,is_featured,status,published_at) values
('Strategic Advisory','strategic-advisory','Strategy, market entry, operating models and growth for complex regulated environments.','Compass',1,true,'published',now()),('AI & Intelligent Systems','ai-intelligent-systems','AI strategy, solution design and automation for smarter decisions and operations.','Brain',2,true,'published',now()),('Research & Intelligence','research-intelligence','Deep research and analytics that uncover insights and inform winning strategies.','Search',3,true,'published',now()),('Gamification & Engagement','gamification-engagement','Designing engaging experiences that drive participation, loyalty and impact.','Gamepad2',4,true,'published',now()),('Digital Transformation','digital-transformation','Modern platforms, process re-imagination and scalable digital solutions.','Layers',5,true,'published',now()),('Policy & Governance','policy-governance','Policy design, regulatory advisory and governance frameworks for sustainable outcomes.','Landmark',6,true,'published',now()) on conflict (slug) do nothing;
insert into ask_jar_prompts(prompt,category,sort_order,status,published_at) values
('How can AI improve a lottery ecosystem?','AI',1,'published',now()),('Trends in digital participation systems?','Participation',2,'published',now()),('Regulatory risks in iGaming markets?','Regulatory',3,'published',now()),('Strategies for player engagement?','Engagement',4,'published',now()) on conflict do nothing;
insert into metrics(label,value,description,icon_key,sort_order,status,published_at) values
('Countries','30+','Global reach across public and private sectors','Globe',1,'published',now()),('Public Sector Engagements','150+','Across multiple mandates and agencies','Landmark',2,'published',now()),('Years of Experience','25+','Deep domain expertise that delivers impact','TrendingUp',3,'published',now()),('Strategic Projects','500+','Delivered with measurable outcomes','Users',4,'published',now()) on conflict do nothing;
insert into site_sections(section_key,eyebrow,headline,subheadline,primary_cta_label,primary_cta_href,secondary_cta_label,secondary_cta_href,status,published_at) values
('home.hero','Strategic Advisory for a Changing World','Intelligence. Strategy. Real Impact.','JAR Advisory partners with governments, enterprises and visionary leaders to navigate complexity, build intelligent solutions and deliver enduring impact in regulated and high-stakes environments.','Explore Our Expertise','/expertise','Ask JAR','/ask-jar','published',now()) on conflict (section_key) do nothing;
