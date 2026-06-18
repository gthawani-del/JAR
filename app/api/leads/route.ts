import { NextResponse } from 'next/server';
import { hashIp, requestIp } from '@/lib/analytics/hash-ip';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { leadSchema } from '@/lib/validation/lead';

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid lead' }, { status: 400 });

  const supabase = createServiceRoleClient();
  const ip_hash = await hashIp(requestIp(request));
  const user_agent = request.headers.get('user-agent');
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({ ...parsed.data, status: 'new', ip_hash, user_agent })
    .select('id,name,email,company,source,status,created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lead });
}
