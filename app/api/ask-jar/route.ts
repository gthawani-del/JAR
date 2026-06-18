import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { hashIp, requestIp } from '@/lib/analytics/hash-ip';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { askJarSchema } from '@/lib/validation/ask-jar';

function responseFor(hasLead: boolean) {
  return hasLead
    ? 'Thank you. Your advisory context has been recorded and linked to this intelligence conversation for review.'
    : 'This is a strategic advisory question. JAR can assess the policy, operational, technology and stakeholder dimensions behind this challenge. Share your name and email when you are ready to route this inquiry for review.';
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = askJarSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid Ask JAR message' }, { status: 400 });

  const supabase = createServiceRoleClient();
  const data = parsed.data;
  const now = new Date().toISOString();
  const ip_hash = await hashIp(requestIp(request));
  const user_agent = request.headers.get('user-agent');
  const assistantContent = responseFor(Boolean(data.name && data.email));

  let conversationId = data.conversationId;
  if (!conversationId) {
    const { data: conversation, error } = await supabase
      .from('ask_jar_conversations')
      .insert({
        conversation_code: randomUUID(),
        title: data.message.slice(0, 120),
        status: data.name && data.email ? 'lead_captured' : 'active',
        contact_name: data.name,
        contact_email: data.email,
        contact_company: data.company,
        lead_capture_completed: Boolean(data.name && data.email),
        ip_hash,
        user_agent,
        last_message_at: now,
        metadata: data.metadata ?? {},
      })
      .select('id,status,lead_id,updated_at')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    conversationId = conversation.id;
  }

  const { data: latestMessage } = await supabase
    .from('ask_jar_messages')
    .select('sequence')
    .eq('conversation_id', conversationId)
    .order('sequence', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextSequence = (latestMessage?.sequence ?? 0) + 1;

  const { data: insertedMessages, error: messageError } = await supabase
    .from('ask_jar_messages')
    .insert([
      { conversation_id: conversationId, role: 'user', content: data.message, sequence: nextSequence },
      { conversation_id: conversationId, role: 'assistant', content: assistantContent, sequence: nextSequence + 1, metadata: { response_mode: 'template' } },
    ])
    .select('id,conversation_id,role,content,created_at');
  if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });

  let lead = null;
  if (data.name && data.email) {
    const { data: insertedLead, error: leadError } = await supabase
      .from('leads')
      .insert({
        name: data.name,
        email: data.email,
        company: data.company,
        message: data.message,
        source: 'ask_jar',
        status: 'new',
        ask_jar_conversation_id: conversationId,
        ip_hash,
        user_agent,
      })
      .select('id,name,email,company,source,status,created_at')
      .single();
    if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 });
    lead = insertedLead;
    await supabase
      .from('ask_jar_conversations')
      .update({ lead_id: insertedLead.id, status: 'lead_captured', lead_capture_completed: true, contact_name: data.name, contact_email: data.email, contact_company: data.company, updated_at: now, last_message_at: now })
      .eq('id', conversationId);
  } else {
    await supabase.from('ask_jar_conversations').update({ updated_at: now, last_message_at: now }).eq('id', conversationId);
  }

  const { data: conversation } = await supabase
    .from('ask_jar_conversations')
    .select('id,status,lead_id,updated_at')
    .eq('id', conversationId)
    .single();

  return NextResponse.json({ conversation, messages: insertedMessages ?? [], lead });
}
