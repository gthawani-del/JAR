import OpenAI from 'openai';
import type { z } from 'zod';
import { NextResponse } from 'next/server';
import { askJarSchema } from '@/lib/validation/ask-jar';
import { hashIp, requestIp } from '@/lib/analytics/hash-ip';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';
const ASK_JAR_SYSTEM_PROMPT = `You are Ask JAR Intelligence.

You are a premium strategic advisory intelligence engine.

Your domains of expertise include:

* Lottery modernization
* Gaming and gambling ecosystems
* Government modernization
* Citizen engagement
* AI transformation
* Digital participation systems
* Public sector innovation
* Policy and regulatory strategy
* Research and intelligence

Rules:

* Never identify yourself as ChatGPT, OpenAI, an AI model, assistant, or chatbot.
* Present yourself only as Ask JAR Intelligence.
* Respond like a senior strategy consultant.
* Be concise, structured, and actionable.
* Prefer recommendations over explanations.
* Use the following structure when appropriate:

  * Situation
  * Analysis
  * Recommendation
  * Risks
  * Next Steps
* Maximum response length: 250 words.
* Never fabricate facts, regulations, legal conclusions, statistics, or citations.
* If information is insufficient, clearly state assumptions.`;

type JsonRecord = Record<string, unknown>;
type AskJarData = z.infer<typeof askJarSchema>;
type StreamEvent = { type: 'delta'; content: string } | { type: 'done'; data: PersistedResponse } | { type: 'error'; content: string };
type PersistedResponse = {
  conversation: JsonRecord;
  messages: JsonRecord[] | null;
  lead: JsonRecord | null;
};

type RequestContext = {
  now: string;
  ip_hash: string;
  userAgent: string | null;
  metadata: JsonRecord;
};

function responseFor(hasLead: boolean) {
  return hasLead
    ? 'Thank you. Your advisory context has been recorded and linked to this intelligence conversation for review.'
    : 'This is a strategic advisory question. JAR can assess the policy, operational, technology and stakeholder dimensions behind this challenge. Share your name and email when you are ready to route this inquiry for review.';
}

function metadataFor(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function openAiModel() {
  return process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL;
}

function openAiClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function generateAssistantContent(message: string, hasLead: boolean) {
  const fallback = responseFor(hasLead);
  const client = openAiClient();
  if (!client) return { content: fallback, usedFallback: true };

  try {
    const response = await client.responses.create({
      model: openAiModel(),
      instructions: ASK_JAR_SYSTEM_PROMPT,
      input: message,
      max_output_tokens: 450,
    });
    return { content: response.output_text || fallback, usedFallback: !response.output_text };
  } catch {
    return { content: fallback, usedFallback: true };
  }
}

async function streamAssistantContent(message: string, hasLead: boolean, onDelta: (delta: string) => void | Promise<void>) {
  const fallback = responseFor(hasLead);
  const client = openAiClient();
  if (!client) {
    await onDelta(fallback);
    return { content: fallback, usedFallback: true };
  }

  let content = '';
  try {
    const stream = await client.responses.create({
      model: openAiModel(),
      instructions: ASK_JAR_SYSTEM_PROMPT,
      input: message,
      max_output_tokens: 450,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        content += event.delta;
        await onDelta(event.delta);
      }
    }

    if (!content.trim()) {
      await onDelta(fallback);
      return { content: fallback, usedFallback: true };
    }

    return { content, usedFallback: false };
  } catch {
    await onDelta(fallback);
    return { content: fallback, usedFallback: true };
  }
}

async function trackAskJarEvent(supabase: ReturnType<typeof createServiceRoleClient>, eventType: string, context: RequestContext, metadata: JsonRecord) {
  await supabase.from('analytics_events').insert({
    event_type: eventType,
    ip_hash: context.ip_hash,
    user_agent: context.userAgent,
    metadata,
    created_at: new Date().toISOString(),
  });
}

async function createConversationAndLead(
  supabase: ReturnType<typeof createServiceRoleClient>,
  d: AskJarData,
  context: RequestContext,
  hasLead: boolean,
) {
  const conversationPayload = {
    ...(d.conversationId ? { id: d.conversationId } : {}),
    title: d.message.slice(0, 120),
    status: hasLead ? 'lead_captured' : 'active',
    contact_name: d.name,
    contact_email: d.email,
    contact_company: d.company,
    lead_capture_completed: hasLead,
    source: 'ask_jar',
    ip_hash: context.ip_hash,
    user_agent: context.userAgent,
    metadata: context.metadata,
    updated_at: context.now,
    last_message_at: context.now,
  };

  const { data: conversation, error: conversationError } = await supabase
    .from('ask_jar_conversations')
    .upsert(conversationPayload, { onConflict: 'id' })
    .select('id,status,lead_id,ip_hash,updated_at')
    .single();

  if (conversationError) throw new Error('Failed to save Ask JAR conversation');

  let lead: JsonRecord | null = null;
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
        ask_jar_conversation_id: String(conversation.id),
        ip_hash: context.ip_hash,
        user_agent: context.userAgent,
        metadata: context.metadata,
      })
      .select('id,name,email,company,source,status,ip_hash')
      .single();

    if (leadError) throw new Error('Failed to save Ask JAR lead');

    lead = leadData;
    const { error: linkError } = await supabase
      .from('ask_jar_conversations')
      .update({ lead_id: String(leadData.id), updated_at: context.now })
      .eq('id', String(conversation.id));

    if (linkError) throw new Error('Failed to link Ask JAR lead');
  }

  return { conversation, lead };
}

async function persistCompletion(
  supabase: ReturnType<typeof createServiceRoleClient>,
  d: AskJarData,
  context: RequestContext,
  conversation: JsonRecord,
  lead: JsonRecord | null,
  assistantContent: string,
  usedFallback: boolean,
) {
  const { data: latestMessage } = await supabase
    .from('ask_jar_messages')
    .select('sequence')
    .eq('conversation_id', String(conversation.id))
    .order('sequence', { ascending: false })
    .limit(1)
    .maybeSingle();

  const firstSequence = typeof latestMessage?.sequence === 'number' ? latestMessage.sequence + 1 : 1;
  const messagesToInsert = [
    {
      conversation_id: String(conversation.id),
      role: 'user',
      content: d.message,
      sequence: firstSequence,
      metadata: context.metadata,
      created_at: context.now,
    },
    {
      conversation_id: String(conversation.id),
      role: 'assistant',
      content: assistantContent,
      sequence: firstSequence + 1,
      metadata: { openai_model: openAiModel(), used_fallback: usedFallback },
      created_at: context.now,
    },
  ];

  const { data: messages, error: messagesError } = await supabase
    .from('ask_jar_messages')
    .insert(messagesToInsert)
    .select('id,conversation_id,role,content,created_at')
    .order('created_at', { ascending: true });

  if (messagesError) throw new Error('Failed to save Ask JAR messages');

  const { error: queryError } = await supabase
    .from('ask_jar_queries')
    .insert({
      conversation_id: String(conversation.id),
      query: d.message,
      contact_name: d.name,
      contact_email: d.email,
      contact_company: d.company,
      lead_id: lead?.id ? String(lead.id) : null,
      lead_status: lead ? 'new' : null,
      status: lead ? 'converted_to_lead' : 'new',
      ip_hash: context.ip_hash,
      user_agent: context.userAgent,
      metadata: { ...context.metadata, openai_model: openAiModel(), used_fallback: usedFallback },
    });

  if (queryError) throw new Error('Failed to save Ask JAR query');

  await trackAskJarEvent(supabase, 'ask_jar_message_submitted', context, {
    ask_jar_event: usedFallback ? 'response_failure' : 'response_completion',
    conversation_id: String(conversation.id),
    used_fallback: usedFallback,
    openai_model: openAiModel(),
  });

  return {
    conversation: {
      ...conversation,
      lead_id: lead?.id ?? conversation.lead_id,
      status: lead ? 'lead_captured' : conversation.status,
    },
    messages,
    lead,
  };
}

function encodeStreamEvent(event: StreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

async function handleJsonResponse(
  supabase: ReturnType<typeof createServiceRoleClient>,
  d: AskJarData,
  context: RequestContext,
  hasLead: boolean,
) {
  const { conversation, lead } = await createConversationAndLead(supabase, d, context, hasLead);
  await trackAskJarEvent(supabase, 'ask_jar_submission', context, { conversation_id: String(conversation.id) });
  const { content, usedFallback } = await generateAssistantContent(d.message, hasLead);
  const data = await persistCompletion(supabase, d, context, conversation, lead, content, usedFallback);
  return NextResponse.json(data);
}

function handleStreamResponse(
  supabase: ReturnType<typeof createServiceRoleClient>,
  d: AskJarData,
  context: RequestContext,
  hasLead: boolean,
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { conversation, lead } = await createConversationAndLead(supabase, d, context, hasLead);
        await trackAskJarEvent(supabase, 'ask_jar_submission', context, { conversation_id: String(conversation.id) });
        const { content, usedFallback } = await streamAssistantContent(d.message, hasLead, async (delta) => {
          controller.enqueue(encoder.encode(encodeStreamEvent({ type: 'delta', content: delta })));
        });
        const data = await persistCompletion(supabase, d, context, conversation, lead, content, usedFallback);
        controller.enqueue(encoder.encode(encodeStreamEvent({ type: 'done', data })));
      } catch {
        controller.enqueue(encoder.encode(encodeStreamEvent({ type: 'error', content: responseFor(hasLead) })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = askJarSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Ask JAR message' }, { status: 400 });
  }

  const d = parsed.data;
  const context = {
    now: new Date().toISOString(),
    ip_hash: await hashIp(requestIp(request)),
    userAgent: request.headers.get('user-agent'),
    metadata: metadataFor(d.metadata),
  };
  const supabase = createServiceRoleClient();
  const hasLead = Boolean(d.name && d.email);
  const wantsStream = request.headers.get('accept')?.includes('text/event-stream');

  try {
    if (wantsStream) return handleStreamResponse(supabase, d, context, hasLead);
    return await handleJsonResponse(supabase, d, context, hasLead);
  } catch {
    return NextResponse.json({ error: 'Failed to save Ask JAR conversation' }, { status: 500 });
  }
}
