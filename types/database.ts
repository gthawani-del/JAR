export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type ContentStatus = 'draft' | 'published' | 'unpublished' | 'archived';
export type AdminRole = 'super_admin' | 'editor' | 'viewer';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed';
export interface AskJarMessage { id: string; conversation_id: string; role: 'user' | 'assistant' | 'system' | 'lead_capture'; content: string; sequence: number; created_at: string; }
export interface AskJarConversation { id: string; status: string; lead_id?: string | null; contact_email?: string | null; created_at: string; updated_at: string; }
