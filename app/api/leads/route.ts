import { NextResponse } from 'next/server';
import { leadSchema } from '@/lib/validation/lead';
import { hashIp, requestIp } from '@/lib/analytics/hash-ip';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = leadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid lead' }, { status: 400 });
  }

  const ip_hash = await hashIp(requestIp(request));
  const supabase = createServiceRoleClient();
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      ...parsed.data,
      status: 'new',
      ip_hash,
      user_agent: request.headers.get('user-agent'),
    })
    .select('id,name,email,company,message,source,status,ip_hash,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 });
  }

  return NextResponse.json({ lead });
}
