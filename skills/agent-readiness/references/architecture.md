# Architecture that survives incremental work

## Assess capabilities, not folders

For each relevant capability, locate its public interface, ordinary callers, and journey tests. Determine who owns coordination, validation, persistence, failures, and resource lifecycle. Compare with confirmed architectural principles, not merely neighboring patterns.

A deep module hides substantial complexity behind an understandable interface. Exported helpers, separate packages, or one enormous function do not establish depth.

Framework adapters translate inputs, delegate application work, and translate outputs. If a command callback coordinates decoding, validation, transactions, and rollback, application behavior has leaked into the adapter.

Multiple public calls can still be correct. A document consumer chooses open/edit/undo/save actions; the module should own buffers, undo bookkeeping, and serialization. Read the [contrasting examples](../examples/public-api-journeys.md) when the distinction is unclear.

## Recommend and improve

For adapter-owned workflows, propose an application-owned public operation that expresses consumer intent. Agree its preserved behavior and resource ownership, migrate callers, and retain useful coverage. Moving helpers without hiding coordination is insufficient.

For architectural drift, establish concise guidance covering core concepts, responsibilities, dependency directions, and important rationale. Identify changes requiring design discussion. Add structural checks where an actual boundary is mechanically enforceable; use focused review for qualitative decisions.

Do not prescribe a service layer, class hierarchy, options object, or one function per journey. When changes affect consumers or persisted formats, use [contracts and change impact](contracts-and-change-impact.md).

## Verify

Drive the capability through its public API with real implementations. Inspect whether callers still coordinate hidden steps. Execute relevant dependency checks and confirm guidance matches the result.

Report architectural quality separately from behavioral coverage. Existing tests can protect behavior even when their entry point reflects a poor boundary.
