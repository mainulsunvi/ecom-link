# Spec 005: First-Run Help Guide

Status: MVP. Feature: `docs/FEATURES.md` M6.

## 1. Problem statement

A merchant installing the plugin for the first time does not know what it does, what credentials it needs, or where to generate them. The plugin must show a Help Guide on first open that covers every required setting so the merchant can connect without leaving Framer to search for docs.

## 2. Data model decision

- `helpGuideSeenAt: string | null` in plugin data. Read path: `App.tsx` reads it on mount; null opens the guide. Write path: closing the guide writes the timestamp once.
- Guide steps live in component state; content is static per release and owned by the Documentation agent.

## 3. Platform API operations

None. Pure UI.

## 4. Credentials required

None. The guide explains the `read` vs `read_write` key choice and links to the connection flow.

## 5. Triggers consumed

First plugin open (timestamp null), or the help icon any time.

## 6. File-by-file change list

- `src/views/HelpGuide.tsx`: modal walkthrough (What this plugin does; What you need; Generate API keys in WooCommerce: Settings, Advanced, REST API; How sync works; What happens to manual edits; Where the docs live), new.
- `src/storage/connections.ts`: `getHelpGuideSeen` / `markHelpGuideSeen` (or a small `storage/onboarding.ts`), extend or new.
- `src/App.tsx`: first-run detection and guide state, extend.
- `src/components/ui/Modal.tsx`: reusable modal shell if not present from spec 002, new.
- Video tutorial placeholder inside the guide, per doc rules.

## 7. Acceptance criteria

1. Given a fresh project (timestamp null), opening the plugin shows the Help Guide automatically.
2. Given a non-null timestamp, the guide does not open automatically but opens from the help icon.
3. Closing the guide writes the timestamp exactly once (no duplicate writes on re-open).
4. The guide contains the key generation path "WooCommerce, Settings, Advanced, REST API" and states that a read key is enough to start.
5. The guide includes the sentence-level rule that manual CMS edits to one-way fields are overwritten on the next sync.
6. All guide strings pass the UX writing rules test, and content follows the Documentation agent's binding rules (you/your, video placeholder, no em-dashes, no "we").

## 8. Open questions

- Step count: proposed 5 steps. Documentation agent may tune wording, not structure, without a new spec.

## Always answer these four

- **Removed then re-added plugin**: timestamp is lost; the guide shows again. Acceptable and arguably desirable.
- **Framer plan limit mid-sync**: not applicable; no sync in this flow.
- **Partial sync failure and retry**: not applicable.
- **Unusually large catalog**: not applicable.
