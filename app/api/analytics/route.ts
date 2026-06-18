import { NextResponse } from 'next/server';
import { hashIp, requestIp } from '@/lib/analytics/hash-ip';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const allowedEvents = new Set([
  'page_view',
  'cta_click',
  'ask_jar_submission',
  'insight_view',
  'contact_form_submission',
  'newsletter_signup',
  'case_study_view',
  'ask_jar_conversation_started',
  'ask_jar_message_submitted',
  'ask_jar_lead_captured',
]);

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const eventType = typeof body.event_type === 'string' && allowedEvents.has(body.event_type) ? body.event_type : 'page_view';
  const supabase = createServiceRoleClient();
  const ip_hash = await hashIp(requestIp(request));
  const user_agent = request.headers.get('user-agent');
  const { data: event, error } = await supabase
    .from('analytics_events')
    .insert({
      event_type: eventType,
      page_path: typeof body.page_path === 'string' ? body.page_path : null,
      entity_type: typeof body.entity_type === 'string' ? body.entity_type : null,
      cta_label: typeof body.cta_label === 'string' ? body.cta_label : null,
      device_type: typeof body.device_type === 'string' ? body.device_type : null,
      traffic_source: typeof body.traffic_source === 'string' ? body.traffic_source : null,
      referrer: typeof body.referrer === 'string' ? body.referrer : null,
      utm_source: typeof body.utm_source === 'string' ? body.utm_source : null,
      utm_medium: typeof body.utm_medium === 'string' ? body.utm_medium : null,
      utm_campaign: typeof body.utm_campaign === 'string' ? body.utm_campaign : null,
      ip_hash,
      user_agent,
      metadata: typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {},
    })
    .select('id,event_type,created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, event });
}
