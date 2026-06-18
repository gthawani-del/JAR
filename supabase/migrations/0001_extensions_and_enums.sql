create extension if not exists pgcrypto;
do $$ begin create type admin_role as enum ('super_admin','editor','viewer'); exception when duplicate_object then null; end $$;
do $$ begin create type content_status as enum ('draft','published','unpublished','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type lead_status as enum ('new','contacted','qualified','closed'); exception when duplicate_object then null; end $$;
do $$ begin create type ask_jar_status as enum ('new','reviewed','flagged','converted_to_lead','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type subscriber_status as enum ('active','unsubscribed','bounced','archived'); exception when duplicate_object then null; end $$;
do $$ begin create type analytics_event_type as enum ('page_view','cta_click','ask_jar_submission','insight_view','contact_form_submission','newsletter_signup','case_study_view','ask_jar_conversation_started','ask_jar_message_submitted','ask_jar_lead_captured'); exception when duplicate_object then null; end $$;
do $$ begin create type audit_action_type as enum ('create','update','delete','publish','unpublish','archive','restore','login','logout','role_change','user_invite','user_disable','upload'); exception when duplicate_object then null; end $$;
