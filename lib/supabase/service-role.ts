import 'server-only';import { createClient } from '@supabase/supabase-js';import { env } from '@/lib/env';
export function createServiceRoleClient(){ if(!env.supabaseUrl || !env.supabaseServiceRoleKey) throw new Error('Missing Supabase service role configuration'); return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, { auth: { persistSession: false } }); }
