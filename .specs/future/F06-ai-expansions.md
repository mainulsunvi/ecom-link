# Spec F06: AI Expansions

Status: Future. Feature: `docs/FEATURES.md` F6.

## 1. Problem statement

The MVP's AI content assist (M7) generates missing short descriptions. Expanding AI capabilities to bulk generation, tone presets, image alt-text, translation, and category-aware copy will provide more value and differentiate the plugin from competitors.

## 2. Data model decision

AI features use Framer's AI APIs (if available) or an external service (OpenAI, Anthropic). No new storage; AI outputs are written directly to CMS fields.

- **Bulk AI pass**: Generate content for all items in a collection (or filtered subset) with a single click.
- **Tone presets**: Pre-defined prompts for different tones (professional, casual, playful, luxury).
- **Image alt-text**: Generate descriptive alt-text for product images based on product name and description.
- **Translation/localization**: Translate product content to other languages (requires Framer's localization feature).
- **Category-aware copy**: Generate content that references the product's category (e.g., "This wool sweater..." for a sweater in the "Clothing" category).

Read path: AI reads CMS item fields (name, description, category). Write path: AI writes to target fields (short description, SEO title, alt-text).

## 3. Platform API operations

None directly. AI features operate on Framer CMS data, not platform APIs.

## 4. Credentials required

If using external AI service (OpenAI/Anthropic): API key stored in plugin settings. If using Framer's AI APIs: no additional credentials (handled by Framer).

## 5. Triggers consumed

None. AI generation is user-initiated.

## 6. File-by-file change list

- `src/ai/bulkGenerator.ts`: Bulk AI generation logic, new
- `src/ai/tonePresets.ts`: Tone preset definitions and prompts, new
- `src/ai/altTextGenerator.ts`: Image alt-text generation, new
- `src/ai/translator.ts`: Translation logic (if external API), new
- `src/ai/categoryAware.ts`: Category-aware prompt enhancement, new
- `src/views/BulkAIModal.tsx`: Bulk generation UI with progress, new
- `src/views/ToneSelector.tsx`: Tone preset dropdown, new
- `src/views/AISettingsModal.tsx`: AI configuration (API key, provider), new
- `src/components/ui/AIProgressBar.tsx`: Progress indicator for bulk operations, new
- `docs/help/AI Expansions.md`: Usage guide for advanced AI features, new

## 7. Acceptance criteria

1. Given a collection with 50 products, the bulk AI pass generates short descriptions for all items in < 60 seconds.
2. Given a user selects the "Professional" tone preset, the generated content uses formal language and avoids slang.
3. Given a product with 3 images, the alt-text generator produces unique, descriptive alt-text for each image.
4. Given a product in the "Clothing" category, the category-aware copy references the category (e.g., "This cotton t-shirt...").
5. Given a user enables translation and selects "Spanish", the AI translates product content to Spanish and writes it to the localized field.
6. Given a bulk AI operation in progress, the UI shows a progress bar with item count (e.g., "23/50 completed").
7. Given a user cancels a bulk AI operation, the completed items are saved and the operation stops.

## 8. Open questions

1. **AI provider**: Should we use Framer's built-in AI (if available), OpenAI GPT-4, Anthropic Claude, or support multiple providers?
2. **Cost**: Should AI features be free (unlimited), or metered (e.g., 100 generations/month on free plan)?
3. **Quality control**: Should we add a "review before apply" step for bulk operations, or trust the AI output?
4. **Translation quality**: Should we use AI for translation (fast, variable quality) or a dedicated service (DeepL, Google Translate)?
5. **Rate limits**: How do we handle AI API rate limits during bulk operations? Implement queuing and backoff?
6. **Prompt engineering**: Should we allow users to customize AI prompts, or provide only presets?

## Always answer these four

- **Removed then re-added plugin**: AI settings cleared; user re-configures API key.
- **Framer plan limit mid-sync**: AI operations are independent of sync; no conflict.
- **Partial sync failure and retry**: AI generation is idempotent; retry on failure.
- **Unusually large catalog**: Bulk AI operations paginate and queue; no performance impact.
