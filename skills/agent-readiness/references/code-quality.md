# Readable, shippable implementation

## Assess

Read representative feature code and project conventions, not only formatter configuration. Inspect names, control flow, errors, interfaces, and where coordination lives. Check active lint/type/format rules, exclusions, and whether normal validation executes them.

Standards worth making explicit:

- Descriptive names and straightforward control flow reduce cognitive load.
- Avoid compressed expressions, nested ternaries, and inline control flow when they obscure intent.
- Types should clarify code, not require elaborate casts or generic machinery.
- Prefer maintained ecosystem solutions for established problems.
- Report failures explicitly rather than silently producing misleading success.
- Add compatibility support only when required; establish existing contracts before removing it.
- Modules should hide complexity rather than transfer it to callers.

## Recommend and improve

Separate mechanical rules from judgment. For example, use the project's formatter and type checker for repeatable conventions, then add concise review guidance for unnecessary abstraction and compatibility hacks.

Where checks are absent, propose suitable ecosystem tools and a check-only command connected to normal validation and CI. Prefer existing dependencies and conventions over overlapping tools. Keep automatic rewriting distinct from checking.

Where qualitative standards are unclear, add concrete good/bad examples to existing contributor guidance. Avoid arbitrary complexity thresholds, blanket exclusions, or unrelated mass cleanup.

## Verify

Run configured checks and inspect their scope. Confirm relevant violations are detected, using a disposable example where needed. Review representative code against qualitative standards and cite observations.

A formatter pass proves formatting—not readability or shippability. A review document does not prove review enforcement.
