import { NextResponse } from 'next/server';
import { askJarSchema } from '@/lib/validation/ask-jar';
import { hashIp, requestIp } from '@/lib/analytics/hash-ip';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

function responseFor(hasLead: boolean) {
  return hasLead
    ? 'Thank you. Your advisory context has been recorded and linked to this intelligence conversation for review.'
    : 'This is a strategic advisory question. JAR can assess the policy, operational, technology and stakeholder dimensions behind this challenge. Share your name and email when you are ready to route this inquiry for review.';
}

function metadataFor(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = askJarSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Ask JAR message' }, { status: 400 });
  }

  const d = parsed.data;
  const now = new Date().toISOString();
  const ip_hash = await hashIp(requestIp(request));
  const supabase = createServiceRoleClient();
  const conversationId = d.conversationId;
  const hasLead = Boolean(d.name && d.email);
  const assistantContent = responseFor(hasLead);
  const metadata = metadataFor(d.metadata);

  const { data: conversation, error: conversationError } = await supabase
    .from('ask_jar_conversations')
    .upsert({
      id: conversationId,
      title: d.message.slice(0, 120),
      status: hasLead ? 'lead_captured' : 'active',
      contact_name: d.name,
      contact_email: d.email,
      contact_company: d.company,
      lead_capture_completed: hasLead,
      source: 'ask_jar',
      ip_hash,
      user_agent: request.headers.get('user-agent'),
      metadata,
      updated_at: now,
      last_message_at: now,
    }, { onConflict: 'id' })
    .select('id,status,lead_id,ip_hash,updated_at')
    .single();

  if (conversationError) {
    return NextResponse.json({ error: 'Failed to save Ask JAR conversation' }, { status: 500 });
  }

  let lead = null;
  if (hasLead) {
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({
        name: d.name,
        email: d.email,
        company: d.company,
        message: d.message,
        source: 'ask_jar',
        status: 'new',
        ask_jar_conversation_id: conversation.id,
        ip_hash,
        user_agent: request.headers.get('user-agent'),
        metadata,
      })
      .select('id,name,email,company,source,status,ip_hash')
      .single();

    if (leadError) {
      return NextResponse.json({ error: 'Failed to save Ask JAR lead' }, { status: 500 });
    }

    lead = leadData;
    const { error: linkError } = await supabase
      .from('ask_jar_conversations')
      .update({ lead_id: lead.id, updated_at: now })
      .eq('id', conversation.id);

    if (linkError) {
      return NextResponse.json({ error: 'Failed to link Ask JAR lead' }, { status: 500 });
    }
  }

  const { data: latestMessage } = await supabase
    .from('ask_jar_messages')
    .select('sequence')
    .eq('conversation_id', conversation.id)
    .order('sequence', { ascending: false })
    .limit(1)
    .maybeSingle();

  const firstSequence = typeof latestMessage?.sequence === 'number' ? latestMessage.sequence + 1 : 1;
  const messagesToInsert = [
    {
      conversation_id: conversation.id,
      role: 'user',
      content: d.message,
      sequence: firstSequence,
      metadata,
      created_at: now,
    },
    {
      conversation_id: conversation.id,
      role: 'assistant',
      content: assistantContent,
      sequence: firstSequence + 1,
      metadata: {},
      created_at: now,
    },
  ];

  const { data: messages, error: messagesError } = await supabase
    .from('ask_jar_messages')
    .insert(messagesToInsert)
    .select('id,conversation_id,role,content,created_at')
    .order('created_at', { ascending: true });

  if (messagesError) {
    return NextResponse.json({ error: 'Failed to save Ask JAR messages' }, { status: 500 });
  }

  const { error: queryError } = await supabase
    .from('ask_jar_queries')
    .insert({
      conversation_id: conversation.id,
      query: d.message,
      contact_name: d.name,
      contact_email: d.email,
      contact_company: d.company,
      lead_id: lead?.id,
      lead_status: lead ? 'new' : null,
      status: lead ? 'converted_to_lead' : 'new',
      ip_hash,
      user_agent: request.headers.get('user-agent'),
      metadata,
    });

  if (queryError) {
    return NextResponse.json({ error: 'Failed to save Ask JAR query' }, { status: 500 });
  }

  return NextResponse.json({
    conversation: {
      ...conversation,
      lead_id: lead?.id ?? conversation.lead_id,
      status: lead ? 'lead_captured' : conversation.status,
    },
    messages,
    lead,
  });
}
