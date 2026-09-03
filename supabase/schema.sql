-- hlpr database schema. Safe to run on a new Supabase project.

create table public.signup_email_domains (
  domain text primary key,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.signup_email_domains enable row level security;
revoke all on public.signup_email_domains from anon, authenticated;
create policy "signup_domains_no_client_access" on public.signup_email_domains
  for select to anon, authenticated using (false);
insert into public.signup_email_domains (domain, reason)
values ('myhunter.cuny.edu', 'Hunter College students')
on conflict (domain) do nothing;
insert into public.signup_email_domains (domain, reason)
values ('login.cuny.edu', 'CUNY Login accounts')
on conflict (domain) do nothing;

create or replace function public.hook_restrict_signup_by_email_domain(event jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_domain text := lower(split_part(event->'user'->>'email', '@', 2));
begin
  if exists (select 1 from public.signup_email_domains where domain = v_domain) then return '{}'::jsonb; end if;
  return jsonb_build_object('error', jsonb_build_object(
    'message', 'hlpr is only open to Hunter students. Use your @myhunter.cuny.edu email.', 'http_code', 403));
end;
$$;
revoke all on function public.hook_restrict_signup_by_email_domain(jsonb) from public, anon, authenticated;
grant execute on function public.hook_restrict_signup_by_email_domain(jsonb) to supabase_auth_admin;
grant select on public.signup_email_domains to supabase_auth_admin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select, update on public.profiles to authenticated;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.signup_email_domains
    where domain = lower(split_part(new.email, '@', 2))
  ) then
    raise exception 'Hunter or CUNY Login email required' using errcode = '22023';
  end if;
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  department text not null check (department = upper(department)),
  number text not null,
  title text not null,
  created_at timestamptz not null default now(),
  unique (department, number)
);
create table public.sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_number text not null,
  semester text not null,
  professor_name text,
  meeting_info text,
  created_at timestamptz not null default now(),
  unique (course_id, section_number, semester)
);
alter table public.courses enable row level security;
alter table public.sections enable row level security;
grant select on public.courses, public.sections to authenticated;
create policy "courses_select_authenticated" on public.courses for select to authenticated using (true);
create policy "sections_select_authenticated" on public.sections for select to authenticated using (true);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (user_id, section_id)
);
alter table public.enrollments enable row level security;
grant select, insert, delete on public.enrollments to authenticated;
create policy "enrollments_select_own" on public.enrollments for select to authenticated using ((select auth.uid()) = user_id);
create policy "enrollments_insert_own" on public.enrollments for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "enrollments_delete_own" on public.enrollments for delete to authenticated using ((select auth.uid()) = user_id);
create index enrollments_section_id_idx on public.enrollments(section_id);

create or replace function public.is_enrolled(p_section_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.enrollments
    where section_id = p_section_id and user_id = (select auth.uid()));
$$;
revoke all on function public.is_enrolled(uuid) from public, anon;
grant execute on function public.is_enrolled(uuid) to authenticated;

create or replace function public.join_or_create_section(
  p_department text, p_number text, p_title text, p_section_number text,
  p_semester text, p_professor_name text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := (select auth.uid());
  v_course_id uuid;
  v_section_id uuid;
begin
  if v_user_id is null then raise exception 'You must be signed in.'; end if;
  if nullif(trim(p_department), '') is null or nullif(trim(p_number), '') is null or
     nullif(trim(p_section_number), '') is null or nullif(trim(p_semester), '') is null then
    raise exception 'Department, course number, section, and semester are required.';
  end if;
  insert into public.courses (department, number, title)
  values (upper(trim(p_department)), trim(p_number), coalesce(nullif(trim(p_title), ''), upper(trim(p_department)) || ' ' || trim(p_number)))
  on conflict (department, number) do update set department = excluded.department returning id into v_course_id;
  insert into public.sections (course_id, section_number, semester, professor_name)
  values (v_course_id, trim(p_section_number), trim(p_semester), nullif(trim(p_professor_name), ''))
  on conflict (course_id, section_number, semester) do update set professor_name = coalesce(public.sections.professor_name, excluded.professor_name)
  returning id into v_section_id;
  insert into public.enrollments (user_id, section_id) values (v_user_id, v_section_id)
  on conflict (user_id, section_id) do nothing;
  return v_section_id;
end;
$$;
revoke all on function public.join_or_create_section(text,text,text,text,text,text) from public, anon;
grant execute on function public.join_or_create_section(text,text,text,text,text,text) to authenticated;

create or replace function public.get_classmates(p_section_id uuid)
returns table (id uuid, full_name text, email text)
language sql security definer stable set search_path = '' as $$
  select p.id, p.full_name, p.email
  from public.profiles p join public.enrollments e on e.user_id = p.id
  where e.section_id = p_section_id and public.is_enrolled(p_section_id)
    and p.id <> (select auth.uid());
$$;
revoke all on function public.get_classmates(uuid) from public, anon;
grant execute on function public.get_classmates(uuid) to authenticated;

create table public.syllabi (
  section_id uuid primary key references public.sections(id) on delete cascade,
  content text not null default '' check (char_length(content) <= 100000),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.syllabi enable row level security;
grant select, insert, update on public.syllabi to authenticated;
create policy "syllabi_select_members" on public.syllabi for select to authenticated using (public.is_enrolled(section_id));
create policy "syllabi_insert_members" on public.syllabi for insert to authenticated with check (public.is_enrolled(section_id) and updated_by = (select auth.uid()));
create policy "syllabi_update_members" on public.syllabi for update to authenticated using (public.is_enrolled(section_id))
  with check (public.is_enrolled(section_id) and updated_by = (select auth.uid()));

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  is_done boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
grant select, insert, update, delete on public.tasks to authenticated;
create policy "tasks_select_members" on public.tasks for select to authenticated using (public.is_enrolled(section_id));
create policy "tasks_insert_members" on public.tasks for insert to authenticated with check (public.is_enrolled(section_id) and created_by = (select auth.uid()));
create policy "tasks_update_members" on public.tasks for update to authenticated using (public.is_enrolled(section_id)) with check (public.is_enrolled(section_id));
create policy "tasks_delete_members" on public.tasks for delete to authenticated using (public.is_enrolled(section_id));
create index tasks_section_created_idx on public.tasks(section_id, created_at);
create index syllabi_updated_by_idx on public.syllabi(updated_by);
create index tasks_created_by_idx on public.tasks(created_by);

-- ---------- 7. Class discussion threads ----------

create table public.discussion_threads (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.discussion_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.discussion_threads(id) on delete cascade,
  parent_message_id uuid references public.discussion_messages(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.discussion_threads enable row level security;
alter table public.discussion_messages enable row level security;
grant select, insert, update, delete on public.discussion_threads, public.discussion_messages to authenticated;

create policy "threads_select_members" on public.discussion_threads for select to authenticated
  using (public.is_enrolled(section_id));
create policy "threads_insert_members" on public.discussion_threads for insert to authenticated
  with check (public.is_enrolled(section_id) and created_by = (select auth.uid()));
create policy "threads_update_authors" on public.discussion_threads for update to authenticated
  using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()) and public.is_enrolled(section_id));
create policy "threads_delete_authors" on public.discussion_threads for delete to authenticated
  using (created_by = (select auth.uid()));

create policy "messages_select_members" on public.discussion_messages for select to authenticated
  using (exists (
    select 1 from public.discussion_threads t
    where t.id = thread_id and public.is_enrolled(t.section_id)
  ));
create policy "messages_insert_members" on public.discussion_messages for insert to authenticated
  with check (created_by = (select auth.uid()) and exists (
    select 1 from public.discussion_threads t
    where t.id = thread_id and public.is_enrolled(t.section_id)
  ));
create policy "messages_update_authors" on public.discussion_messages for update to authenticated
  using (created_by = (select auth.uid())) with check (created_by = (select auth.uid()));
create policy "messages_delete_authors" on public.discussion_messages for delete to authenticated
  using (created_by = (select auth.uid()));

create index discussion_threads_section_created_idx on public.discussion_threads(section_id, created_at desc);
create index discussion_threads_creator_idx on public.discussion_threads(created_by);
create index discussion_messages_thread_created_idx on public.discussion_messages(thread_id, created_at);
create index discussion_messages_parent_idx on public.discussion_messages(parent_message_id);
create index discussion_messages_creator_idx on public.discussion_messages(created_by);

create or replace function public.ensure_reply_stays_in_thread()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.parent_message_id is not null and not exists (
    select 1 from public.discussion_messages parent
    where parent.id = new.parent_message_id and parent.thread_id = new.thread_id
  ) then
    raise exception 'A reply must belong to the same discussion thread.';
  end if;
  return new;
end;
$$;
revoke all on function public.ensure_reply_stays_in_thread() from public, anon, authenticated;
create trigger discussion_reply_thread_guard
  before insert or update of parent_message_id, thread_id on public.discussion_messages
  for each row execute function public.ensure_reply_stays_in_thread();

alter publication supabase_realtime add table public.discussion_threads;
alter publication supabase_realtime add table public.discussion_messages;
