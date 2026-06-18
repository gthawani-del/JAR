# JAR Advisory Website – Codex Build PRD v1

## Objective

Build a premium marketing website and admin backoffice for JAR Advisory.

JAR Advisory is a strategic advisory firm specializing in regulated markets, public sector modernization, AI transformation, research & intelligence, digital systems and gamification.

The website must feel:

* Premium
* Intelligent
* Trustworthy
* Modern
* Institutional

The website must NOT feel:

* Casino operator
* Betting company
* Crypto platform
* Generic AI startup
* SaaS dashboard
* Chatbot website

Desktop Light, Desktop Dark, Mobile Light and Mobile Dark reference images are the visual source of truth.

---

# Technology Stack

Frontend:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion

Animation:

* React Three Fiber
* Three.js

Backend:

* Supabase

Environment Variables:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

IMPORTANT:

SUPABASE_SERVICE_ROLE_KEY must never be exposed to frontend code.

Use only in:

* Server Actions
* Route Handlers
* API endpoints
* Backend services

---

# Site Navigation

Home

Expertise

Sectors

Intelligence

Ask JAR

About

Contact

---

# Homepage Structure

1. Hero
2. Expertise
3. Ask JAR
4. Strategic Engagements
5. Latest Insights
6. Metrics
7. Footer

---

# Hero Section

Headline:
Complex Inputs. Clear Strategy.

Supporting copy:
Strategic advisory, intelligence and AI solutions for governments, regulated industries and emerging digital ecosystems.

Primary CTA:
Let's Connect

Secondary CTA:
Explore Expertise

Hero visual:
Custom animated J object.

No stock photos.

No videos.

No chatbot UI.

---

# J Component

The J is the signature visual asset.

Design:

* Architectural
* Fragmented
* Premium
* Metallic
* Gold signal accents

Not:

* Glass sculpture
* Crypto logo
* Neon object
* Hair-like abstraction

Animation:

Load:

* Signals appear
* Fragments assemble
* J forms
* Gold pulse travels through structure

Idle:

* Subtle signal movement
* Soft reflections
* Minimal motion

Desktop:

* Gentle parallax

Mobile:

* Simplified animation

No spinning.
No excessive movement.

---

# Expertise Section

Display capability cards:

1. Strategic Advisory
2. AI & Intelligent Systems
3. Research & Intelligence
4. Gamification & Engagement
5. Digital Transformation
6. Policy & Governance

Editable from CMS.

---

# Ask JAR

Purpose:

AI-powered intelligence experience.

Must NOT be presented as a chatbot.

Must feel like an intelligence engine.

Components:

* Prompt input
* Suggested prompts
* Submit action
* Results page placeholder
* Lead capture

Example prompts:

* How can AI improve public sector operations?
* How should governments modernize participation systems?
* What are emerging opportunities in regulated markets?

Future AI integration will be added later.

Create architecture for expansion.

---

# Strategic Engagements

Display featured engagements.

CMS managed.

Fields:

* Title
* Description
* Sector
* Image
* Status
* Sort order

Initially show 3 featured engagements.

---

# Latest Insights

CMS-driven article system.

Fields:

* Title
* Summary
* Cover image
* Author
* Published date
* Category
* Slug
* SEO metadata

---

# Metrics Section

CMS managed.

Editable metrics.

Examples:

* Countries
* Engagements
* Projects
* Years Experience

---

# Footer

Navigation links.

Contact information.

Social links.

Legal pages.

---

# Admin Backoffice

Route:

/admin

Role-based access.

Roles:

* Super Admin
* Editor
* Viewer

---

# CMS Module

Editable:

Hero

Expertise

Ask JAR prompts

Strategic Engagements

Insights

Metrics

Footer

SEO

Media assets

Features:

* Draft
* Publish
* Unpublish
* Reorder
* Image upload

---

# Leads Module

Capture:

Contact forms

Ask JAR submissions

CTA forms

Fields:

* Name
* Email
* Company
* Message
* Source
* Status
* Notes
* Created date

Statuses:

* New
* Contacted
* Qualified
* Closed

---

# Ask JAR Admin

Store:

* User query
* Generated response
* Contact details
* Lead status
* Category

Admin can:

* Review queries
* Flag queries
* Export queries
* Mark as lead

---

# Analytics Module

Track:

* Page views
* CTA clicks
* Ask JAR submissions
* Insight article views
* Contact form submissions
* Device type
* Traffic source

Admin dashboard required.

---

# Supabase Tables

admin_users

site_sections

expertise_items

engagements

insights

metrics

media_assets

leads

ask_jar_queries

ask_jar_prompts

analytics_events

---

# Non Goals

Do not build:

* Chatbot bubble
* Live chat
* Customer support widget
* Casino visuals
* Crypto visuals
* Excessive animations
* Auto-playing videos

Focus on premium advisory experience.
