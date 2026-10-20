# Compaction

Give the agent enough working context to continue the task correctly. Manage that context separately from stored history, durable task state, and longer-term memory.

When assembling agent context, apply [prompt-writing guidance](prompt-writing.md): supply the role, assignment, desired outcome, relevant operational knowledge, and concrete validity requirements. Do not assume the agent inherits the developer's context.

For large tool responses, apply [tool-result guidance](tool-design.md#return-useful-results-without-flooding-context). Bound what enters context while preserving access to the complete response.

For cache effects, read [prompt-caching guidance](prompt-caching.md). For retention and recovery decisions, read [memory and history](memory-and-history.md#separate-context-reduction-retention-and-recovery-access).

## Compact for continuation, not retrospective narration

Treat the summary as a checkpoint for the next decision, not a story about the conversation.

Preserve the information needed to continue:

- The user's current goal, requirements, and constraints.
- Completed, ongoing, and blocked work, including what was actually verified.
- Decisions and the rationale needed to avoid reopening settled questions.
- Next actions and unresolved questions.
- Relevant evidence, limitations, and references needed to inspect supporting artifacts.
- Exact identifiers, paths, and errors when their spelling matters to subsequent work.

Update that checkpoint across repeated compactions. Incorporate new progress, resolve old blockers, and remove superseded information without losing still-applicable constraints.

## Preserve a coherent continuation

- Retain recent working detail verbatim where it remains useful; summarize older material to reduce its context cost.
- Choose cut points that preserve valid message structure. Keep tool results with the tool calls they answer.
- When a long-running request must be split, preserve its original assignment and earlier progress needed to interpret the retained continuation.
- Keep active system instructions separate from the conversation summary rather than relying on a paraphrase to preserve them.
- Rebuild context consistently from the selected summary, retained messages, and current instructions.

## Carry reliable state outside free-form summaries

- Track facts programmatically when the harness already has reliable structured records for them.
- Use summaries for semantic context, not to reconstruct all execution state from prose on every compaction.
- Distinguish an attempted operation from its confirmed result. A recorded tool call does not prove the requested change succeeded.
- Preserve consequential evidence and recovery pointers explicitly when shortening tool results for the summarizer.
- Do not assume a path or diagnostic at the end of a long result survives generic prefix truncation.

A compaction checkpoint describes the context for continued reasoning. It does not, by itself, provide [durable execution](durable-execution.md) or define memory for future tasks.

## Integrate compaction with the request lifecycle

- Check context size before the next model request, including new tool results and other injected material.
- Base the decision on the context actually being sent and the active model's limits, not conversation length alone.
- Use applicable provider usage and estimates for newly added material. Recalculate when edits or compaction invalidate earlier measurements.
- Leave room for continued generation instead of waiting for a context-overflow error.
- Treat overflow recovery as a separate execution path rather than the normal compaction trigger.
- Reuse the framework's compaction support when it satisfies the required behavior.

## Treat failed compaction as a failed transition

- Accept a new checkpoint only after summarization completes successfully.
- Reject output-limit-truncated summaries rather than installing partial text as a valid checkpoint.
- Surface failures and cancellation so the caller can recover without assuming context was successfully reduced.
- Keep diagnostic records of compaction outcomes according to the project's observability and retention policy.

## Verify continuity

- Test continued work after compaction, not merely whether the summary reads well or uses fewer tokens.
- Check that the agent preserves requirements, recognizes completed work, and follows the appropriate next action.
- Exercise repeated compaction and a cut within one long-running request.
- Confirm retained tool-call/result sequences remain valid and referenced artifacts remain accessible where promised.
- If history recovery is supported, test retrieval of a detail omitted from the summary.
- Check that incomplete summarization does not become an accepted checkpoint.
