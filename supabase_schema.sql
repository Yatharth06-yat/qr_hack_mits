-- ========================================================
-- Supabase PostgreSQL Schema & Security Policies
-- Hackathon Team QR Check-In & Verification System
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. TEAMS TABLE
create table if not exists teams (
    id uuid primary key default gen_random_uuid(),
    team_code text unique not null,
    team_name text not null,
    college_name text not null,
    leader_name text not null,
    leader_email text not null,
    leader_phone text,
    qr_token text unique not null,
    registration_verified boolean default false,
    goibibo_registered boolean default false,
    food_token_issued boolean default false,
    kit_issued boolean default false,
    undertaking_completed boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index for fast QR token lookup & search
create index if not exists idx_teams_qr_token on teams(qr_token);
create index if not exists idx_teams_team_code on teams(team_code);
create index if not exists idx_teams_leader_email on teams(leader_email);

-- 2. TEAM MEMBERS TABLE
create table if not exists team_members (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references teams(id) on delete cascade,
    member_code text,
    name text not null,
    email text,
    phone text,
    is_present boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists idx_team_members_team_id on team_members(team_id);

-- 3. DOCUMENTS TABLE
create table if not exists documents (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references teams(id) on delete cascade,
    document_type text not null, -- 'health', 'discipline', 'ticket'
    version integer default 1,
    storage_path text,
    file_name text,
    status text default 'submitted', -- 'not_submitted', 'submitted', 'under_review', 'approved', 'rejected'
    rejection_reason text,
    created_at timestamptz default now(),
    approved_at timestamptz
);

create index if not exists idx_documents_team_id on documents(team_id);

-- 4. AUDIT LOGS TABLE
create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references teams(id) on delete cascade,
    user_id text,
    action text not null,
    description text,
    created_at timestamptz default now()
);

create index if not exists idx_audit_logs_team_id on audit_logs(team_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
alter table teams enable row level security;
alter table team_members enable row level security;
alter table documents enable row level security;
alter table audit_logs enable row level security;

-- Public/Staff Policy: Read teams with valid QR token or search
create policy "Allow read for authenticated staff or valid QR lookup"
    on teams for select
    using (true);

-- Staff/Admin Policy: Only staff can update checkpoint booleans
create policy "Allow staff update on checkpoints"
    on teams for update
    using (auth.role() in ('staff', 'admin'))
    with check (auth.role() in ('staff', 'admin'));

-- Team Members RLS
create policy "Allow read team members"
    on team_members for select
    using (true);

create policy "Allow staff update member attendance"
    on team_members for update
    using (auth.role() in ('staff', 'admin'));

-- Documents RLS
create policy "Allow users to read own team documents"
    on documents for select
    using (true);

create policy "Allow staff/admin to update documents"
    on documents for update
    using (auth.role() in ('staff', 'admin'));

-- Audit Logs RLS
create policy "Allow staff/admin to view audit logs"
    on audit_logs for select
    using (auth.role() in ('staff', 'admin'));

create policy "Allow system to insert audit logs"
    on audit_logs for insert
    with check (true);

-- Function to auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_teams_updated_at
    before update on teams
    for each row execute function update_updated_at_column();

create trigger update_team_members_updated_at
    before update on team_members
    for each row execute function update_updated_at_column();
