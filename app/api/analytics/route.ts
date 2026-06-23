import { NextResponse } from 'next/server';
import { hashIp, requestIp } from '@/lib/analytics/hash-ip';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const analyticsEventTypes = new Set([
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

function stringField(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === 'string' ? value : undefined;
}

function eventTypeFor(body: Record<string, unknown>) {
  const candidate = stringField(body, 'event_type') ?? stringField(body, 'type');
  return candidate && analyticsEventTypes.has(candidate) ? candidate : 'page_view';
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const eventBody = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
  const ip_hash = await hashIp(requestIp(request));
  const now = new Date().toISOString();
  const event = {
    ...eventBody,
    event_type: eventTypeFor(eventBody),
    ip_hash,
    user_agent: request.headers.get('user-agent'),
    created_at: now,
  };

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('analytics_events')
    .insert({
      event_type: event.event_type,
      page_path: stringField(eventBody, 'page_path'),
      entity_type: stringField(eventBody, 'entity_type'),
      entity_id: stringField(eventBody, 'entity_id'),
      cta_label: stringField(eventBody, 'cta_label'),
      device_type: stringField(eventBody, 'device_type'),
      traffic_source: stringField(eventBody, 'traffic_source'),
      referrer: stringField(eventBody, 'referrer') ?? request.headers.get('referer'),
      utm_source: stringField(eventBody, 'utm_source'),
      utm_medium: stringField(eventBody, 'utm_medium'),
      utm_campaign: stringField(eventBody, 'utm_campaign'),
      session_id: stringField(eventBody, 'session_id'),
      ip_hash,
      user_agent: request.headers.get('user-agent'),
      metadata: eventBody,
      created_at: now,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to save analytics event' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: { ...event, id: data.id } });
}
