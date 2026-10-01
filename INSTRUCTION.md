# Instruction for this Project

Please go through the instruction for this project.

## 1. Scaffold
The Framer plugin is already scaffolded using the Framer CLI. **Use the existing plugin.** Do not re-scaffold or create a new project structure.


## 2. Preflight Works

Before starting development, complete a structured research and planning phase to define the product clearly and reduce unnecessary rework later.

### 2.1 Product Research and Discovery

The goal of this app is to allow users to connect **Framer** with multiple eCommerce platforms, including:

- WooCommerce
- Shopify
- Wix
- Webflow
- Other supported eCommerce platforms in the future

Before writing implementation code, research and document the information required to understand the product, its users, and the technical requirements.

The research should cover at least:

- Product goals and core use cases
- Target users and customer personas
- Customer problems and pain points
- Competitor research and existing solutions
- Competitor features, limitations, and opportunities
- Core product features
- Functional and technical specifications
- User flows
- Data synchronization requirements
- Expected eCommerce data structure
- Framer integration requirements and limitations
- Authentication and connection flows
- Error handling and sync failure scenarios
- Information architecture
- Admin/dashboard requirements
- Security considerations
- Scalability considerations
- Platform API limitations, rate limits, and authentication requirements
- Potential future integrations and expansion opportunities

Do not start major implementation work until the core product requirements, architecture assumptions, and MVP scope are sufficiently understood.

### 2.2 Feature Planning

Once the research, requirements, and specifications are collected, document the product features in:

`docs/FEATURES.md`

The file must contain two clearly separated sections:

#### - MVP Features

These are the features required for the first usable release.

The initial development effort must focus exclusively on these features unless a future feature is technically required to support the MVP architecture.

#### - Future Features

These are planned enhancements, additional integrations, advanced functionality, and ideas that are not required for the first release.

Future features should be documented but should **not be implemented during the MVP phase** unless explicitly requested.

### 2.3 Initial Platform Scope

The long-term goal is to support multiple eCommerce platforms, but development should be completed incrementally.

The integration priority is:

1. **WooCommerce**
2. Shopify
3. Wix
4. Webflow
5. Other eCommerce platforms

For the first version, focus on **WooCommerce ↔ Framer synchronization only**.

The application is intended to be launched initially as a **free app**, so the first release should prioritize a reliable, simple, and maintainable WooCommerce integration rather than attempting to support multiple platforms at once.

The architecture should still be designed with future platform integrations in mind. Avoid tightly coupling the entire application to WooCommerce when a reusable abstraction or provider-based architecture can reasonably support Shopify, Wix, Webflow, and other platforms later.


## 3. Spec Driven Development
- Read `docs/FEATURES.md` and generate specs based on the features listed there.
- **Prioritize MVP specs first**, then move on to secondary/additional features.
- Make sure the MVP includes some AI features.

## 4. Help Guide
- Build a **Help Guide** that appears the first time a user installs the plugin on their store.
- The Help Guide should let the user know all required settings and information for the plugin.

## 5. Coding Conventions
- Write all functions as **full function declarations**, e.g. `function name() {}`.
- **Avoid arrow functions** unless the situation specifically calls for one (e.g. preserving `this` context, inline callbacks where a declaration would be awkward).
- Make the code as much readable as you can, also add helpful comment so that anybody can read the function and understand it properly.

## 6. UI/UX (Polaris)
- Use **Framer Best Pracitices** throughout the plugin.
- Build reusable UI components inside `/components/` and reuse them wherever applicable instead of duplicating markup/logic.
- Prefer **modals** over custom routes for UI/UX flows and forms — EXCEPT rules: rule create/edit live on dedicated routes.
- **Boolean toggles always use the Switch component** (`plugin/components/ui/Switch.tsx`) — never Checkbox, Polaris SettingToggle, or button-based toggles (user directive 2026-09-06).

## 7. UX Writing

Every user UI string follows these binding rules:

1. **Headings use Title Case.** Page titles, card and section headings, modal titles, and table column headers capitalize every major word ("Checkout Function Status", "Stop on Match", "Rate Simulator"). Buttons, field labels, option lists, and body text stay in sentence case ("Save changes", "Rule name").
2. **Never use em-dashes (—) or en-dashes (–) in UI strings.** This covers headings, banners, badges, tooltips, help text, error messages, flash/audit messages, option labels, and placeholders. Use a period, colon, semicolon, or parentheses instead. The only allowed dash glyph is the lone "—" used as an empty-value placeholder in tables and lists.
3. **Help text uses the Tooltip pattern.** Field-level help stays short (one sentence) in the component's `helpText`; anything longer rides the shared info icon + Tooltip component `/components/ui/HelpTooltip.tsx` next to the heading or row it explains. Never dump multi-sentence explanations into `helpText`.
4. **No developer jargon in UI strings.** Never show raw enum values (`CARRIER_RATE`, `FIRST_MATCH`, `true`/`false`); use the friendly label maps (`KIND_LABELS`, `EVALUATION_MODE_OPTIONS`, "Yes"/"No"). Write errors and statuses as full sentences a merchant can act on.
5. **Pluralize counts properly**: "1 rule", "2 rules", "kept for 30 days". Never "rule(s)", "zone(s)", "run(s)".
6. **Every sentence starts with a capital letter**, including fragments after a "·" separator, and ends with a period.

## 8. Forms
- Use the **Best** hook for form handling.
- Use **Form Actions** for form submissions.

## 9. Documentation
- User-facing help documentation lives in **`docs/help/`** and must follow eight binding rules (user directive 2026-09-07):
  1. Point of view is **you/your** — write directly to the store owner.
  2. Use VISIBLE placeholders in square brackets where screenshots go, like `[Add Zone Condition Screenshot]`. Never hide them in HTML comments (they are invisible when rendered).
  3. Every document has a **Video tutorial** section with a visible placeholder, like `[Add Getting Started Video Tutorial]`.
  4. Prefer how-to / doc-blog style: short intro, headed steps, what-to-read-next.
  5. **Docs ship with code** — finishing a task or changing plugin behavior includes updating the affected `docs/help/` pages in the same run.
  6. Always check grammar and use easy-to-read English words. Describe outcomes in the **future tense**: after the reader acts, say what will happen next ("Click **Save**. A green banner will confirm the change."). Write naturally, the way one person explains things to another; avoid formulaic patterns that read as AI-generated (endless bold-lead bullet lists, filler like "The good news:", perfectly parallel sentences).
  7. Never use the word "we" (or "us"/"our") in help content — the docs are for the merchant, not the developer.
  8. Never use em-dashes in help content.

## 10. Sub-Agents
Create the following agent definition files in `.github/agents/`, each configured with the selected model for its role:

- `architect.agent.md`
- `backend.agent.md`
- `documentation.agent.md`
- `frontend.agent.md`
- `orchestrator.agent.md`
- `planner.agent.md`
- `reviewer.agent.md`
- `security.agent.md`
- `tester.agent.md`

Example of a sub-agent file (Note: this example file is from other shopify app we have, the structure is kind of same. If you need to change anything based on Framer scope, you can change.)
```md
---
name: Architect
description: Description of this file.
model: ['GLM-5.2']
tools: ['read', 'search', 'edit']
argument-hint: The feature to design
---

# Architect

You decide the shape of things. You do not build them and you do not schedule
them.

## Before proposing anything

Read `architecture.md` and the three most recent files in `.specs/` so that
numbering, naming, and conventions stay consistent. Read the Prisma schema.

## Responsibilities

- Define project architecture and select design patterns
- Define folder structure and the API surface
- Define the Prisma schema and any migration path from the current one
- Produce sequence diagrams as mermaid blocks inside the spec
- Update `architecture.md` when a decision changes it

## Output contract

Write exactly one numbered spec to `.specs/NNN-slug.md`. It must contain, in
this order:

1. **Problem statement.** Two or three sentences.
2. **Data model decision.** Shopify metafield vs metaobject vs Prisma table,
   with the reasoning. State the read path and the write path separately.
3. **Admin GraphQL operations**, named explicitly. Note the estimated cost
   for anything in a loop.
4. **Access scopes required**, and whether `shopify.plugin.toml` changes. Flag
   it loudly if it does, because that forces merchant reauthorization.
5. **Webhook topics consumed**, with the idempotency key for each.
6. **File-by-file change list.** Path, and one line on what changes.
7. **Acceptance criteria.** Each one must be verifiable by a test. No
   criteria like "works correctly".
8. **Open questions.** List them. Never silently resolve one by guessing.

## Always answer these four

Every spec states what happens on:

- plugin uninstall, then reinstall by the same shop
- Plan downgrade while data exceeds the lower plan's limits
- Partial webhook delivery failure and the retry that follows
- A shop with an unusually large catalog, where pagination changes behaviour

## Never

- Write business logic or UI
- Edit anything outside `.specs/` and `architecture.md`
- Produce a task breakdown, ordering, or estimates. That is Planner's job.
- Resolve an open question by picking one arbitrarily
```