# Documentation that serves the reader

## Assess by audience and task

Follow a confirmed user journey as a new reader. Separately follow contributor setup and validation instructions.

- Users need purpose, prerequisites, first successful use, realistic examples, and relevant contracts or limitations.
- Contributors need setup, architecture and rationale, validation, debugging, and change expectations.
- Historical reasoning belongs in decision records or release notes only when useful.

Look for work journals in usage docs, function inventories without task guidance, irrelevant negative descriptions, incomplete examples, and instructions dependent on undocumented local state. Volume and freshness timestamps do not establish quality.

Identify authoritative product and design guidance. If it conflicts with behavior, use [contracts and change impact](contracts-and-change-impact.md); do not silently rewrite expectations to match code.

## Recommend and improve

For unusable onboarding, propose a complete first-use example with prerequisites, real inputs, invocation, and recognizable output. For mixed audiences, move contributor detail to its appropriate existing location and link it.

Keep docs about current tasks and behavior. Explain limitations that affect decisions, not everything a feature does not do. Prefer updating the existing source of truth over creating competing instruction files.

Where practical, exercise important examples through existing integration or documentation tooling. Add an affected-docs question to the normal review process so changes preserve accuracy. Link authoritative external manuals instead of reproducing them.

## Verify

Run important examples with their stated prerequisites and real implementation. Check links, commands, public interfaces, and expected outcomes. Read the result without development history: can the intended reader accomplish the task?

Separate executed examples from editorial judgments and unverified instructions. Do not create documentation for every helper or append the readiness audit to the README.
