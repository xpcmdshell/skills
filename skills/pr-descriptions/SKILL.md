---
name: pr-descriptions
description: "Writes and edits concise PR descriptions before opening a pull request, explaining what changed, why it matters, and how the implementation solves it. Use when drafting, revising, or reviewing a PR description in preparation for opening a pull request."
---

# PR Descriptions

Use this skill when writing or editing a PR description before opening a pull request.

## Purpose

A PR description is a review aid, not an activity log. Give a maintainer enough context to decide why the change belongs, understand the design, and check that the implementation addresses the problem.

Every description must cover:

- **What:** the behavior or system boundary that changes.
- **Why:** the concrete problem and its consequence. Explain the impact chain instead of stopping at labels such as “security,” “correctness,” or “cleanup.”
- **How:** the mechanism that fixes the problem and the important responsibilities or invariants it preserves.

Use headings only when they improve scanning. A short PR may cover all three in two paragraphs. A larger PR may use descriptive headings and focused bullets.

## Gather facts first

Read the diff, related issue, and relevant surrounding code before drafting. Establish:

1. previous behavior.
2. concrete consequence or maintenance cost.
3. root cause or missing boundary.
4. behavior after the change.
5. implementation strategy and responsibility split.
6. non-obvious limitations, migration requirements, or risks a reviewer must evaluate.

Do not infer motivation, impact, or verification that the available evidence does not support.

## Draft for maintainers

- Lead with the behavior change, not “This PR” or a restatement of the title.
- Describe the submitted change in declarative voice. Write “X now does Y,” not imperative instructions such as “Add X” or “Replace Y.”
- Explain why the old behavior matters before spending words on implementation details.
- Include technical detail that lets a reviewer evaluate sufficiency. Omit line-by-line narration.
- When wrapping or replacing existing behavior, name each layer and state what the new layer enforces and what remains delegated.
- Prefer concrete nouns and observable consequences. Avoid vague terms such as “safe,” “robust,” “better,” “normal,” or “the original implementation” without explanation.
- Keep one authoritative explanation of each idea. Remove repeated summaries and bullets that restate nearby prose.
- Prefer ordinary punctuation and direct sentences. Do not compress separate ideas with semicolons or em dashes.

## Omit routine material

Do not add sections merely because PR templates often contain them.

Omit by default:

- test and verification diaries.
- generated lists of changed files.
- boilerplate compatibility sections when behavior is unchanged.
- implementation chronology.
- exhaustive edge-case inventories.
- claims that CI will prove automatically.

Include testing, rollout, compatibility, screenshots, or migration details only when they expose a reviewer decision, unusual risk, manual requirement, or limitation that is not evident from the change itself.

## Title

Use a specific outcome-oriented title. Name the affected behavior and the intended result. Avoid generic titles such as “Fix issue,” “Improve handling,” or “Refactor code.” Match the repository's capitalization and issue-linking conventions.

## Review pass

Before presenting the draft, ask:

1. Can a maintainer explain what changes after reading it once?
2. Does the reason establish a concrete consequence and why the change should merge?
3. Does the implementation description show why the fix is sufficient without walking through every line?
4. Are important boundaries, preserved mechanics, and deliberate behavior changes explicit?
5. Can any sentence, heading, bullet, or adjective be removed without losing useful information?
6. Is every claim grounded in the diff, issue, source, or observed behavior?

## Rewrite examples

```text
Bad:
This PR improves cache handling. It updates the cache key and adds invalidation.
Testing was performed locally.

Good:
Role changes could leave cached permissions active until the entry expired because
cache keys did not include the role revision. Include the revision in each key and
invalidate entries when roles change, while retaining the existing eviction and TTL rules.
```

```text
Bad:
Refactor the parser to be safer and handle edge cases.

Good:
The parser stopped at the first NUL byte, but the downstream decoder processed the
full buffer. Scan the explicit buffer length before delegation so no unchecked suffix
reaches the decoder. The decoder still owns syntax validation and output construction.
```

## Final standard

The shortest acceptable PR description is the one that still covers what changed, why it matters, and how the implementation addresses it. Concision is removal of waste, not removal of context.
