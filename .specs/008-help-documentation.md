# Spec 008: User-Facing Help Documentation

Status: MVP. Feature: `docs/FEATURES.md` M10.

## 1. Problem statement

Every merchant-facing behavior of the plugin must have documentation that ships with the code, follows the eight binding rules in INSTRUCTION.md section 9, and never drifts from what the plugin actually does. The MVP needs six complete pages before release.

## 2. Data model decision

Markdown files in `docs/help/`, one page per topic, linked from each other and from the in-plugin Help Guide (spec 005). No storage, no API. Read path: the merchant opens the docs from the Help Guide link or the marketplace listing. Write path: the Documentation agent updates the affected page in the same run as any behavior change (rule 5).

## 3. Platform API operations

None.

## 4. Credentials required

None. Pages explain the key scopes (`read` to start, `read_write` for two-way sync) in merchant language.

## 5. Triggers consumed

Any behavior change anywhere in the MVP. Docs ship with code; a change without its doc update fails review (Reviewer agent checklist).

## 6. File-by-file change list

- `docs/help/Getting Started.md`: new.
- `docs/help/Connect Your WooCommerce Store.md`: new.
- `docs/help/Sync Products.md`: new.
- `docs/help/Sync Inventory Both Ways.md`: new (two-way preview, conflicts, key upgrade).
- `docs/help/Fix Connection Problems.md`: new (error matrix in merchant terms).
- `docs/help/AI Content Assist.md`: new.
- `INSTRUCTION.md`: untouched; rules already binding.

## 7. Acceptance criteria

1. All six pages exist with a heading, short intro, headed steps, and a "What to read next" section.
2. Every page contains a Video tutorial section with a visible placeholder such as `[Add Getting Started Video Tutorial]`.
3. Screenshot placeholders are visible square brackets, never HTML comments (regex test: no `<!--` screenshot comments).
4. A test script (or lint rule) asserts no em-dash characters and none of "we ", "us ", or "our " in any page.
5. Outcomes use the future tense: after each instruction step, the page states what will happen ("Click **Sync now**. The progress bar will show items as they sync.").
6. Every documented step matches plugin behavior: the Connect page names the exact UI labels from spec 002, the Two-Way page describes preview and conflict defaults from spec 004.
7. Point of view is you/your throughout (sampled reader check).

## 8. Open questions

- Hosting location for docs beyond the repo (marketplace link target): outside MVP code scope; flagged for the release checklist.

## Always answer these four

- **Removed then re-added plugin**: docs are static; they document reconnect behavior on the Connect page (from spec 002 answer).
- **Framer plan limit mid-sync**: documented on the Sync Products page with the limit sentence merchants will see.
- **Partial sync failure and retry**: documented on Fix Connection Problems with the retry path.
- **Unusually large catalog**: safety cap and resumable syncs documented on Sync Products.
